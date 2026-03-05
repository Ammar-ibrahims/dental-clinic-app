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
    const { dentist_id, patient_id, appointment_date, appointment_time, timezone } = req.body;
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

        // 4. Return the response with the name attached
        res.status(201).json({
            ...newAppt,
            patient_name: patientName,
            Patient: { name: patientName } // Added for frontend compatibility
        });

    } catch (err) {
        console.error("❌ Create Appointment Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// ... keep your existing updateStatus, remove, and getAvailableSlots below ...
export const updateStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const result = await AppointmentModel.updateAppointmentStatus(req.params.id, status);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Appointment not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await AppointmentModel.deleteAppointment(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Appointment not found' });
        res.json({ message: 'Appointment deleted', id: req.params.id });
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