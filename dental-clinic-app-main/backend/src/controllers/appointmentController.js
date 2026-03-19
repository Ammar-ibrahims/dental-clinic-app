import * as AppointmentModel from '../models/appointmentModel.js';
import * as DoctorModel from '../models/doctorModel.js';
import * as PatientModel from '../models/patientModel.js';
import * as googleCalendarService from '../services/googleCalendarService.js';
import * as appointmentSyncService from '../services/appointmentSyncService.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';
import pool from '../config/db.js';

// Helper to check if an ID is a MongoDB ObjectID
// Update this helper at the top of appointmentController.js
// A more robust check to prevent "Cast to ObjectId" crashes
const isMongoId = (id) => {
    if (!id) return false;
    const sId = String(id).trim();
    return sId.length === 24 && /^[0-9a-fA-F]{24}$/.test(sId);
};
/**
 * Helper: Fetches patient name from either SQL or Mongo
 */
const getEnrichedPatientName = async (patientId) => {
    if (!patientId) return 'Unknown Patient';

    const cleanId = typeof patientId === 'string' ? patientId.trim() : patientId;

    try {
        if (isMongoId(cleanId)) {
            if (mongoose.connection.readyState === 1) {
                // We check for both 'fullName' and 'name' just in case
                const mongoPatient = await PatientMongo.findById(cleanId);
                if (mongoPatient) {
                    return mongoPatient.fullName || mongoPatient.name || 'Unnamed Patient';
                }
            }
        } else {
            const sqlPatientRows = await PatientModel.getPatientById(cleanId);
            if (sqlPatientRows.rows.length > 0) {
                const p = sqlPatientRows.rows[0];
                return p.name || p.fullName || 'Unnamed Patient';
            }
        }
    } catch (err) {
        console.error(`❌ Enrichment error for ID ${cleanId}:`, err.message);
    }
    return 'Unknown Patient';
};

export const getAll = async (req, res) => {
    try {
        const result = await AppointmentModel.getAllAppointments();
        const appointments = result.rows;

        const enrichedAppointments = await Promise.all(appointments.map(async (appt) => {
            const patientName = await getEnrichedPatientName(appt.patient_id);

            // We return EVERY possible field name to satisfy the frontend
            return {
                ...appt,
                patient_name: patientName,
                name: patientName,
                Patient: { name: patientName, fullName: patientName }
            };
        }));

        res.json(enrichedAppointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getById = async (req, res) => {
    try {
        const result = await AppointmentModel.getAppointmentById(req.params.id);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

        const appt = result.rows[0];
        const patientName = await getEnrichedPatientName(appt.patient_id);

        res.json({
            ...appt,
            patient_name: patientName,
            name: patientName,
            Patient: { name: patientName }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const create = async (req, res) => {
    const { dentist_id, patient_id, appointment_date, appointment_time, timezone, treatment_type, notes } = req.body;
    const tz = timezone || 'Asia/Karachi';

    try {
        // 1. Check local DB conflict (PostgreSQL)
        const localConflict = await AppointmentModel.checkConflict(
            dentist_id, appointment_date, appointment_time
        );
        if (localConflict.rows.length > 0) {
            return res.status(409).json({
                error: 'This time slot is already booked. Please choose another time.',
            });
        }

        // 2. Create the appointment in PostgreSQL
        const result = await AppointmentModel.createAppointment(req.body);
        const newAppt = result.rows[0];

        // 3. SAFE ENRICHMENT: Find the patient name without crashing
        const patientName = await getEnrichedPatientName(newAppt.patient_id);

        // 4. GOOGLE CALENDAR SYNC (Background-ish) using new service
        appointmentSyncService.syncAppointmentToGoogle(newAppt.id);

        // 5. Return the response
        res.status(201).json({
            ...newAppt,
            patient_name: patientName,
            Patient: { name: patientName }
        });

    } catch (err) {
        console.error("❌ Create Appointment Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ... keep your existing updateStatus, remove, and getAvailableSlots below ...
export const update = async (req, res) => {
    const { id } = req.params;
    const { dentist_id, appointment_date, appointment_time, treatment_type, notes, timezone } = req.body;
    const tz = timezone || 'Asia/Karachi';

    try {
        // 1. Authorization & Existence Check
        const currentApptRes = await AppointmentModel.getAppointmentById(id);
        if (currentApptRes.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

        const currentAppt = currentApptRes.rows[0];

        // If patient, ensure they own it
        if (req.user.role === 'patient') {
            const userId = req.user.id;
            const patientResult = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
            if (patientResult.rows.length === 0 || String(patientResult.rows[0].id) !== String(currentAppt.patient_id)) {
                return res.status(403).json({ error: 'Not authorized to edit this appointment' });
            }
        }

        // 2. Conflict Check (if time/dentist changed)
        const newDentistId = parseInt(dentist_id);
        const hasTimeOrDentistChanged = newDentistId !== currentAppt.dentist_id ||
            appointment_date !== currentAppt.appointment_date ||
            appointment_time !== currentAppt.appointment_time;

        if (hasTimeOrDentistChanged) {
            const conflict = await AppointmentModel.checkConflict(newDentistId, appointment_date, appointment_time);
            if (conflict.rows.length > 0 && conflict.rows[0].id !== parseInt(id)) {
                return res.status(409).json({ error: 'This time slot is already booked.' });
            }
        }

        // 3. Update in PostgreSQL
        const result = await AppointmentModel.updateAppointment(id, { dentist_id: newDentistId, appointment_date, appointment_time, treatment_type, notes });
        const updatedAppt = result.rows[0];

        // 4. Update Google Calendar
        if (currentAppt.google_event_id) {
            try {
                const isDentistChanged = newDentistId !== currentAppt.dentist_id;
                const patientName = await getEnrichedPatientName(currentAppt.patient_id);

                if (isDentistChanged) {
                    // Delete from old dentist calendar
                    const oldDocTokens = await DoctorModel.getDoctorTokens(currentAppt.dentist_id);
                    if (oldDocTokens.rows.length > 0) {
                        const row = oldDocTokens.rows[0];
                        if (row.google_access_token && row.google_refresh_token) {
                            const tokens = { access_token: row.google_access_token, refresh_token: row.google_refresh_token, expiry_date: Number(row.google_token_expiry) };
                            await googleCalendarService.deleteEvent(tokens, currentAppt.google_event_id);
                            console.info(`🗑️ Deleted Google Event ${currentAppt.google_event_id} from old dentist`);
                        }
                    }

                    // Create for new dentist calendar
                    const newDocTokens = await DoctorModel.getDoctorTokens(newDentistId);
                    if (newDocTokens.rows.length > 0) {
                        const row = newDocTokens.rows[0];
                        if (row.google_access_token && row.google_refresh_token) {
                            const tokens = { access_token: row.google_access_token, refresh_token: row.google_refresh_token, expiry_date: Number(row.google_token_expiry) };

                            let startStr = `${appointment_date}T${appointment_time}`;
                            if (startStr.split(':').length === 2) startStr += ':00';
                            const [h, m] = appointment_time.split(':').map(Number);
                            let eh = h; let em = m + 30;
                            if (em >= 60) { eh += 1; em -= 60; }
                            const endStr = `${appointment_date}T${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}:00`;

                            const newEvent = await googleCalendarService.createEvent(tokens, {
                                summary: `Dental Appointment - ${patientName}`,
                                description: `Treatment: ${treatment_type || 'General Checkup'}\nNotes: ${notes || 'N/A'}`,
                                start: { dateTime: startStr, timeZone: tz },
                                end: { dateTime: endStr, timeZone: tz },
                            });

                            if (newEvent && newEvent.id) {
                                await AppointmentModel.updateGoogleEventId(id, newEvent.id);
                                console.info(`✅ Created new Google Event ${newEvent.id} for new dentist`);
                            }
                        }
                    }
                } else {
                    // Dentist same, update event on existing calendar
                    const docTokens = await DoctorModel.getDoctorTokens(newDentistId);
                    if (docTokens.rows.length > 0) {
                        const row = docTokens.rows[0];
                        if (row.google_access_token && row.google_refresh_token) {
                            const tokens = { access_token: row.google_access_token, refresh_token: row.google_refresh_token, expiry_date: Number(row.google_token_expiry) };

                            let startStr = `${appointment_date}T${appointment_time}`;
                            if (startStr.split(':').length === 2) startStr += ':00';
                            const [h, m] = appointment_time.split(':').map(Number);
                            let eh = h; let em = m + 30;
                            if (em >= 60) { eh += 1; em -= 60; }
                            const endStr = `${appointment_date}T${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}:00`;

                            await googleCalendarService.updateEvent(tokens, currentAppt.google_event_id, {
                                summary: `Dental Appointment - ${patientName}`,
                                description: `Treatment: ${treatment_type || 'General Checkup'}\nNotes: ${notes || 'N/A'}`,
                                start: { dateTime: startStr, timeZone: tz },
                                end: { dateTime: endStr, timeZone: tz },
                            });
                            console.info(`✅ Updated Google Event ${currentAppt.google_event_id} (Same dentist)`);
                        }
                    }
                }
            } catch (googleError) {
                console.error("⚠️ Google Calendar Sync Sync Error during update:", googleError.message);
            }
        }

        res.json(updatedAppt);
    } catch (err) {
        console.error("❌ Update Appointment Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

export const updateStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    try {
        const result = await AppointmentModel.updateAppointmentStatus(id, status);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
        const appointment = result.rows[0];

        // GOOGLE CALENDAR SYNC: Delete if Cancelled
        if (status === 'Cancelled' && appointment.google_event_id) {
            appointmentSyncService.deleteGoogleEvent(id);
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const remove = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch appointment first so we have the dentist_id and google_event_id
        const apptRes = await AppointmentModel.getAppointmentById(id);
        if (apptRes.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
        const appointment = apptRes.rows[0];

        const result = await AppointmentModel.deleteAppointment(id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Appointment not found' });

        // GOOGLE CALENDAR SYNC: Delete event
        if (appointment.google_event_id) {
            appointmentSyncService.deleteGoogleEvent(id);
        }

        res.json({ message: 'Appointment deleted', id: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAvailableSlots = async (req, res) => {
    const { dentist_id, date, timezone } = req.query;
    if (!dentist_id || !date) {
        return res.status(400).json({ error: 'dentist_id and date are required' });
    }

    // Explicitly set Karachi offset (+05:00) to stop the UTC mismatch
    const tzOffset = "+05:00";
    const tzName = timezone || 'Asia/Karachi';

    try {
        // 1. Get slots already booked in Local DB
        const dbResult = await AppointmentModel.getBookedSlots(dentist_id, date);
        const localBookedSlots = dbResult.rows.map(r => r.appointment_time.slice(0, 5));

        // 2. Define Clinic Hours (9:00 AM to 5:00 PM)
        let clinicSlots = [];
        for (let h = 9; h <= 16; h++) {
            clinicSlots.push(`${h.toString().padStart(2, '0')}:00`);
            clinicSlots.push(`${h.toString().padStart(2, '0')}:30`);
        }

        // 3. Check Google Calendar
        const doctorTokensData = await DoctorModel.getDoctorTokens(dentist_id);
        let googleBusySlots = [];

        if (doctorTokensData.rows.length > 0) {
            const row = doctorTokensData.rows[0];
            if (row.google_access_token && row.google_refresh_token) {
                const tokens = {
                    access_token: row.google_access_token,
                    refresh_token: row.google_refresh_token,
                    expiry_date: row.google_token_expiry,
                };

                // Query Google for the whole day in Karachi
                const timeMin = `${date}T00:00:00Z`;
                const timeMax = `${date}T23:59:59Z`;
                const busyPeriods = await googleCalendarService.getBusyPeriods(tokens, timeMin, timeMax, tzName);

                clinicSlots.forEach(slotTime => {
                    // Create timestamps with the Karachi offset so they match Google's absolute time
                    const slotStart = new Date(`${date}T${slotTime}:00${tzOffset}`).getTime();
                    const slotEnd = slotStart + (30 * 60000);

                    const isBusyOnGoogle = busyPeriods.some(period => {
                        const gStart = new Date(period.start).getTime();
                        const gEnd = new Date(period.end).getTime();
                        // Overlap detection
                        return slotStart < gEnd && slotEnd > gStart;
                    });

                    if (isBusyOnGoogle) googleBusySlots.push(slotTime);
                });
            }
        }

        // 4. FINAL FILTER: Remove local bookings, Google events, and PAST times for today
        const nowPKT = new Date();
        // Shift 'now' to show what time it is specifically in Karachi for comparison
        const nowPKTTime = nowPKT.getTime();

        const finalAvailableSlots = clinicSlots.filter(slot => {
            // Remove if already booked
            if (localBookedSlots.includes(slot) || googleBusySlots.includes(slot)) return false;

            // If the user picks TODAY, hide slots that are in the past
            const todayStr = nowPKT.toISOString().split('T')[0];
            if (date === todayStr) {
                const slotAbsoluteTime = new Date(`${date}T${slot}:00${tzOffset}`).getTime();
                // Only show if the slot starts at least 5 minutes from now
                return slotAbsoluteTime > nowPKTTime;
            }

            return true;
        });

        console.log(`Slots for ${date}: Found ${finalAvailableSlots.length} free slots.`);

        res.json({
            dentist_id: parseInt(dentist_id),
            date,
            available_slots: finalAvailableSlots
        });

    } catch (err) {
        console.error("❌ Slot Fetch Error:", err.message);
        res.status(500).json({ error: "Could not calculate slots." });
    }
};

export const getMyAppointments = async (req, res) => {
    try {
        const userId = req.user.id; // This is the ID from the 'users' table

        // 1. Find the patient record linked to this user_id
        // We look for the patient whose 'user_id' matches the logged-in user's ID
        const patientResult = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);

        if (patientResult.rows.length === 0) {
            console.log(`No patient record found for user_id: ${userId}`);
            return res.json([]); // Return empty if no patient profile exists
        }

        const patientId = patientResult.rows[0].id;
        console.log(`Found patient_id: ${patientId} for user_id: ${userId}`);

        // 2. Get appointments for this patient
        const result = await pool.query(
            `SELECT a.*, d.name as dentist_name 
             FROM appointments a 
             JOIN doctors d ON a.dentist_id = d.id 
             WHERE a.patient_id = $1 
             ORDER BY a.appointment_date DESC`,
            [patientId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error in getMyAppointments:", err);
        res.status(500).json({ error: err.message });
    }
};