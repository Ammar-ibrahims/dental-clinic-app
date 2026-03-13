import * as AppointmentModel from '../models/appointmentModel.js';
import * as DoctorModel from '../models/doctorModel.js';
import * as PatientModel from '../models/patientModel.js';
import * as googleCalendarService from '../services/googleCalendarService.js';
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
        let patientName = 'Patient';
        try {
            // Only search MongoDB if the ID is a valid 24-character string
            if (isMongoId(patient_id)) {
                const mongoPatient = await PatientMongo.findById(patient_id);
                if (mongoPatient) patientName = mongoPatient.fullName || mongoPatient.name;
            } else {
                // If it's a number (like 69), look in PostgreSQL instead
                const sqlPatient = await PatientModel.getPatientById(patient_id);
                if (sqlPatient.rows.length > 0) {
                    patientName = sqlPatient.rows[0].name || 'Patient';
                }
            }
        } catch (enrichError) {
            console.warn("⚠️ Could not fetch patient name for response, using default.");
        }

        // 4. GOOGLE CALENDAR SYNC (Background-ish)
        try {
            const doctorTokensData = await DoctorModel.getDoctorTokens(dentist_id);
            if (doctorTokensData.rows.length > 0) {
                const row = doctorTokensData.rows[0];
                if (row.google_access_token && row.google_refresh_token) {
                    const tokens = {
                        access_token: row.google_access_token,
                        refresh_token: row.google_refresh_token,
                        expiry_date: Number(row.google_token_expiry)
                    };

                    // Calculate Start/End for Google (Ensure RFC3339 format)
                    let startStr = `${appointment_date}T${appointment_time}`;
                    if (startStr.split(':').length === 2) startStr += ':00'; // Add :00 if only HH:mm

                    const [h, m] = appointment_time.split(':').map(Number);
                    let eh = h;
                    let em = m + 30; // 30-min default
                    if (em >= 60) { eh += 1; em -= 60; }
                    const endStr = `${appointment_date}T${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}:00`;

                    console.log("DEBUG: Sending to Google:", { startStr, endStr, tz });

                    const googleEvent = await googleCalendarService.createEvent(tokens, {
                        summary: `Dental Appointment - ${patientName}`,
                        description: `Treatment: ${treatment_type || 'General Checkup'}\nNotes: ${notes || 'N/A'}`,
                        start: { dateTime: startStr, timeZone: tz },
                        end: { dateTime: endStr, timeZone: tz },
                    });

                    if (googleEvent && googleEvent.id) {
                        await AppointmentModel.updateGoogleEventId(newAppt.id, googleEvent.id);
                        console.info(`✅ Synced appointment to Google Calendar (ID: ${googleEvent.id}) for Dentist ${dentist_id}`);
                    }
                }
            }
        } catch (googleError) {
            const details = googleError.response?.data?.error || googleError.message;
            console.error("❌ Google Calendar Sync Failed (but booking saved):", JSON.stringify(details));
        }

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
export const updateStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    try {
        const result = await AppointmentModel.updateAppointmentStatus(id, status);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
        const appointment = result.rows[0];

        // GOOGLE CALENDAR SYNC: Delete if Cancelled
        if (status === 'Cancelled' && appointment.google_event_id) {
            try {
                const doctorTokensData = await DoctorModel.getDoctorTokens(appointment.dentist_id);
                if (doctorTokensData.rows.length > 0) {
                    const row = doctorTokensData.rows[0];
                    if (row.google_access_token && row.google_refresh_token) {
                        const tokens = {
                            access_token: row.google_access_token,
                            refresh_token: row.google_refresh_token,
                            expiry_date: Number(row.google_token_expiry)
                        };
                        await googleCalendarService.deleteEvent(tokens, appointment.google_event_id);
                        console.info(`🗑️ Deleted Google Calendar event for cancelled appointment ${id}`);
                    }
                }
            } catch (googleError) {
                console.error("⚠️ Failed to delete Google event on cancellation:", googleError.message);
            }
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
            try {
                const doctorTokensData = await DoctorModel.getDoctorTokens(appointment.dentist_id);
                if (doctorTokensData.rows.length > 0) {
                    const row = doctorTokensData.rows[0];
                    if (row.google_access_token && row.google_refresh_token) {
                        const tokens = {
                            access_token: row.google_access_token,
                            refresh_token: row.google_refresh_token,
                            expiry_date: Number(row.google_token_expiry)
                        };
                        await googleCalendarService.deleteEvent(tokens, appointment.google_event_id);
                        console.info(`🗑️ Deleted Google Calendar event for deleted appointment ${id}`);
                    }
                }
            } catch (googleError) {
                console.error("⚠️ Failed to delete Google event on deletion:", googleError.message);
            }
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