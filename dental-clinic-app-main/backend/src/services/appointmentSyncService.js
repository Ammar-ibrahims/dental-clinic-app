import * as AppointmentModel from '../models/appointmentModel.js';
import * as DoctorModel from '../models/doctorModel.js';
import * as PatientModel from '../models/patientModel.js';
import * as googleCalendarService from '../services/googleCalendarService.js';
import * as mailerLiteService from './mailerLiteService.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';

const isMongoId = (id) => {
    if (!id) return false;
    const sId = String(id).trim();
    return sId.length === 24 && /^[0-9a-fA-F]{24}$/.test(sId);
};

const getEnrichedPatientName = async (patientId) => {
    if (!patientId) return 'Unknown Patient';
    const cleanId = typeof patientId === 'string' ? patientId.trim() : patientId;
    try {
        if (isMongoId(cleanId)) {
            if (mongoose.connection.readyState === 1) {
                const mongoPatient = await PatientMongo.findById(cleanId);
                if (mongoPatient) return mongoPatient.fullName || mongoPatient.name;
            }
        } else {
            const sqlPatient = await PatientModel.getPatientById(cleanId);
            if (sqlPatient.rows.length > 0) return sqlPatient.rows[0].name;
        }
    } catch (err) {
        console.warn("⚠️ Could not fetch patient name for sync:", err.message);
    }
    return 'Patient';
};

export const syncAppointmentToGoogle = async (appointmentId) => {
    try {
        const apptRes = await AppointmentModel.getAppointmentById(appointmentId);
        if (apptRes.rows.length === 0) return;
        const appt = apptRes.rows[0];

        const doctorTokensData = await DoctorModel.getDoctorTokens(appt.dentist_id);
        if (doctorTokensData.rows.length === 0) return;

        const row = doctorTokensData.rows[0];
        if (!row.google_access_token || !row.google_refresh_token) return;

        const tokens = {
            access_token: row.google_access_token,
            refresh_token: row.google_refresh_token,
            expiry_date: Number(row.google_token_expiry)
        };

        const patientName = await getEnrichedPatientName(appt.patient_id);
        const tz = appt.timezone || 'Asia/Karachi';

        const dateObj = appt.appointment_date instanceof Date ? appt.appointment_date : new Date(appt.appointment_date);
        const y = dateObj.getFullYear();
        const m_ = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d_ = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m_}-${d_}`;

        let startStr = `${dateStr}T${appt.appointment_time}`;
        if (startStr.split(':').length === 2) startStr += ':00';

        const [h, m] = appt.appointment_time.split(':').map(Number);
        let eh = h;
        let em = m + 30;
        if (em >= 60) { eh += 1; em -= 60; }
        const endStr = `${dateStr}T${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}:00`;

        const googleEvent = await googleCalendarService.createEvent(tokens, {
            summary: `Dental Appointment - ${patientName}`,
            description: `Treatment: ${appt.treatment_type || 'General Checkup'}\nNotes: ${appt.notes || 'N/A'}`,
            start: { dateTime: startStr, timeZone: tz },
            end: { dateTime: endStr, timeZone: tz },
        });

        if (googleEvent && googleEvent.id) {
            await AppointmentModel.updateGoogleEventId(appt.id, googleEvent.id);
            console.info(`✅ Synced appointment ${appt.id} to Google Calendar`);

            // NEW: Send Appointment Confirmation Email via MailerLite
            if (appt.email) {
                try {
                    const readableDate = new Date(appt.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });
                    await mailerLiteService.sendAppointmentEmail(
                        appt.email,
                        patientName,
                        `${readableDate} at ${appt.appointment_time}`
                    );
                } catch (emailErr) {
                    console.error("⚠️ Failed to send confirmation email:", emailErr.message);
                }
            }
        }
    } catch (error) {
        console.error("❌ Google Calendar Sync Error:", error.message);
    }
};

export const deleteGoogleEvent = async (appointmentId) => {
    try {
        const apptRes = await AppointmentModel.getAppointmentById(appointmentId);
        if (apptRes.rows.length === 0) return;
        const appt = apptRes.rows[0];

        if (!appt.google_event_id) return;

        const doctorTokensData = await DoctorModel.getDoctorTokens(appt.dentist_id);
        if (doctorTokensData.rows.length === 0) return;

        const row = doctorTokensData.rows[0];
        if (!row.google_access_token || !row.google_refresh_token) return;

        const tokens = {
            access_token: row.google_access_token,
            refresh_token: row.google_refresh_token,
            expiry_date: Number(row.google_token_expiry)
        };

        await googleCalendarService.deleteEvent(tokens, appt.google_event_id);
        console.info(`🗑️ Deleted Google Calendar event for appointment ${appointmentId}`);
    } catch (error) {
        console.error("❌ Google Calendar Delete Error:", error.message);
    }
};
