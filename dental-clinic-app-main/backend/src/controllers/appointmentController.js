import * as AppointmentModel from '../models/appointmentModel.js';
import * as DoctorModel from '../models/doctorModel.js';
import * as PatientModel from '../models/patientModel.js';
import * as googleCalendarService from '../services/googleCalendarService.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';

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
        return res.status(400).json({ error: 'dentist_id and date query params are required' });
    }
    const tz = timezone || 'Asia/Karachi';
    try {
        const result = await AppointmentModel.getBookedSlots(dentist_id, date);
        const bookedSlots = result.rows.map((r) => r.appointment_time.slice(0, 5));

        const doctorTokensData = await DoctorModel.getDoctorTokens(dentist_id);
        if (doctorTokensData.rows.length > 0) {
            const row = doctorTokensData.rows[0];
            if (row.google_access_token && row.google_refresh_token) {
                const tokens = {
                    access_token: row.google_access_token,
                    refresh_token: row.google_refresh_token,
                    expiry_date: row.google_token_expiry,
                };

                const timeMin = new Date(`${date}T00:00:00Z`);
                timeMin.setDate(timeMin.getDate() - 1);
                const timeMax = new Date(`${date}T23:59:59Z`);
                timeMax.setDate(timeMax.getDate() + 1);

                const busyPeriods = await googleCalendarService.getBusyPeriods(tokens, timeMin.toISOString(), timeMax.toISOString(), tz);

                const possibleSlots = [];
                for (let h = 9; h <= 16; h++) {
                    possibleSlots.push(`${h.toString().padStart(2, '0')}:00`);
                    possibleSlots.push(`${h.toString().padStart(2, '0')}:30`);
                }

                busyPeriods.forEach(period => {
                    const googleStartStr = period.start.slice(0, 19);
                    const googleEndStr = period.end.slice(0, 19);

                    possibleSlots.forEach(slotTime => {
                        const slotStartStr = `${date}T${slotTime}:00`;
                        const sh = parseInt(slotTime.slice(0, 2), 10);
                        const sm = parseInt(slotTime.slice(3, 5), 10);
                        let eh = sh;
                        let em = sm + 30;
                        if (em >= 60) { eh += 1; em -= 60; }
                        const slotEndStr = `${date}T${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}:00`;

                        if (slotStartStr < googleEndStr && slotEndStr > googleStartStr) {
                            if (!bookedSlots.includes(slotTime)) {
                                bookedSlots.push(slotTime);
                            }
                        }
                    });
                });
            }
        }
        res.json({ dentist_id: parseInt(dentist_id), date, booked_slots: bookedSlots });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};