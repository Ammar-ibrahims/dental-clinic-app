import OpenAI from 'openai';
import pool from '../config/db.js';
import * as AppointmentModel from '../models/appointmentModel.js';
import * as PatientModel from '../models/patientModel.js';
import * as appointmentSyncService from '../services/appointmentSyncService.js';
import { sendEmail } from '../services/mailerLiteService.js'; // Ensure this path is correct

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PATIENT_ASSISTANT_ID = process.env.PATIENT_ASSISTANT_ID;

// === HELPER: Get Patient ID ===
async function getPatientId(userId) {
    const result = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) throw new Error('Patient profile not found');
    return result.rows[0].id;
}

// === DATABASE TOOL FUNCTIONS ===
async function getMyProfile(patientId) {
    const result = await pool.query('SELECT name, email, phone, date_of_birth, gender, blood_group, address, medical_history FROM patients WHERE id = $1', [patientId]);
    return { profile: result.rows[0] };
}

async function updateMyProfile(patientId, updates) {
    const currentRes = await PatientModel.getPatientById(patientId);
    const merged = { ...currentRes.rows[0], ...updates };
    const result = await PatientModel.updatePatient(patientId, merged);
    return { success: true, profile: result.rows[0] };
}

async function getMyAppointments(patientId) {
    const result = await pool.query(`SELECT a.id, a.appointment_date, a.appointment_time, a.status, d.name as doctor_name FROM appointments a JOIN doctors d ON a.dentist_id = d.id WHERE a.patient_id = $1 ORDER BY a.appointment_date ASC`, [patientId]);
    return { appointments: result.rows };
}

async function getAvailableDoctors() {
    const result = await pool.query('SELECT id, name, specialty FROM doctors WHERE is_active = true');
    return { doctors: result.rows };
}

async function getAvailableSlots(doctor_id, date) {
    const requestedDate = new Date(date);
    const now = new Date();

    // 1. If the requested date is in the past, return empty
    if (requestedDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
        return { available_slots: [] };
    }

    // 2. Get booked slots from DB
    const result = await pool.query(`
        SELECT appointment_time 
        FROM appointments 
        WHERE dentist_id = $1 
          AND appointment_date::date = $2::date 
          AND status != 'Cancelled'
    `, [doctor_id, date]);

    const booked = result.rows.map(r => String(r.appointment_time).substring(0, 5));

    // 3. Generate all possible slots (9:00 to 16:30)
    const allSlots = [];
    for (let h = 9; h <= 16; h++) {
        const hStr = h.toString().padStart(2, '0');
        allSlots.push(`${hStr}:00`);
        if (h < 16) allSlots.push(`${hStr}:30`);
    }

    // 4. Filter out booked slots AND past slots if date is today
    const available = allSlots.filter(slot => {
        if (booked.includes(slot)) return false;

        // If date is today, check if time has passed
        if (requestedDate.toDateString() === now.toDateString()) {
            const [slotH, slotM] = slot.split(':').map(Number);
            if (slotH < now.getHours() || (slotH === now.getHours() && slotM <= now.getMinutes())) {
                return false;
            }
        }
        return true;
    });

    return { available_slots: available };
}

async function bookAppointment(patientId, doctor_id, date, time, treatment) {
    // 1. AUTO-CLEANUP
    try {
        const existing = await pool.query(
            "SELECT id FROM appointments WHERE patient_id = $1 AND dentist_id = $2 AND appointment_date::date = $3::date AND status != 'Cancelled'",
            [patientId, doctor_id, date]
        );
        for (const row of existing.rows) {
            console.log(`🧹 Auto-cleaning previous appointment ${row.id} for reschedule compatibility.`);
            await appointmentSyncService.deleteGoogleEvent(row.id);
            await AppointmentModel.deleteAppointment(row.id);
        }
    } catch (err) {
        console.warn("⚠️ Auto-cleanup warning:", err.message);
    }

    // 2. Create Appointment
    const result = await AppointmentModel.createAppointment({
        patient_id: patientId,
        dentist_id: doctor_id,
        appointment_date: date,
        appointment_time: time,
        treatment_type: treatment || 'General Checkup'
    });
    const newAppt = result.rows[0];

    // 3. Sync to Google
    appointmentSyncService.syncAppointmentToGoogle(newAppt.id);

    // 4. Send Email via MailerLite
    try {
        const patientRes = await pool.query('SELECT name, email FROM patients WHERE id = $1', [patientId]);
        const patient = patientRes.rows[0];

        if (patient && patient.email) {
            const html = `
                <h1>Appointment Confirmed!</h1>
                <p>Hello ${patient.name},</p>
                <p>Your appointment is confirmed for <strong>${date}</strong> at <strong>${time}</strong>.</p>
                <p>Treatment: ${treatment || 'General Checkup'}</p>
                <p>We look forward to seeing you!</p>
            `;
            await sendEmail(patient.email, "Appointment Confirmation - Dental Clinic", html);
            console.log(`📧 Confirmation email sent to ${patient.email}`);
        }
    } catch (emailErr) {
        console.error("⚠️ Failed to send confirmation email:", emailErr.message);
        // We don't throw here because the appointment was already booked successfully
    }

    return { success: true, appointment: newAppt };
}

async function cancelAppointment(patientId, appointmentId) {
    // 1. Delete from Google Calendar first (needs DB to find event ID)
    await appointmentSyncService.deleteGoogleEvent(appointmentId);

    // 2. Hard delete from DB as requested by the user
    await AppointmentModel.deleteAppointment(appointmentId);

    return { success: true, message: "Appointment deleted from database and Google Calendar." };
}

async function rescheduleAppointment(patientId, oldAppointmentId, doctor_id, date, time, treatment) {
    try {
        // 1. Delete old appointment from Google Calendar
        await appointmentSyncService.deleteGoogleEvent(oldAppointmentId);

        // 2. Delete old appointment from DB
        await AppointmentModel.deleteAppointment(oldAppointmentId);

        // 3. Book new appointment
        const result = await AppointmentModel.createAppointment({
            patient_id: patientId,
            dentist_id: doctor_id,
            appointment_date: date,
            appointment_time: time,
            treatment_type: treatment || 'General Checkup'
        });

        // 4. Sync new appointment to Google
        await appointmentSyncService.syncAppointmentToGoogle(result.rows[0].id);

        return { success: true, appointment: result.rows[0], message: "Old appointment deleted and new one scheduled successfully." };
    } catch (error) {
        console.error("Reschedule Error:", error);
        return { success: false, error: error.message };
    }
}

async function rescheduleMyLastAppointment(patientId, doctor_id, date, time, treatment) {
    try {
        // 1. Find the most recent appointment for this patient
        const lastApptRes = await pool.query(
            "SELECT id FROM appointments WHERE patient_id = $1 AND status != 'Cancelled' ORDER BY created_at DESC LIMIT 1",
            [patientId]
        );

        if (lastApptRes.rows.length > 0) {
            const oldId = lastApptRes.rows[0].id;
            console.log(`🔄 Rescheduling last appointment ${oldId}`);
            await appointmentSyncService.deleteGoogleEvent(oldId);
            await AppointmentModel.deleteAppointment(oldId);
        }

        // 2. Book the new one
        return await bookAppointment(patientId, doctor_id, date, time, treatment);
    } catch (error) {
        console.error("Reschedule (No-ID) Error:", error);
        return { success: false, error: error.message };
    }
}

// === DISPATCHER ===
async function dispatchTool(name, args, patientId) {
    const parsedArgs = JSON.parse(args);
    console.log(`🤖 AI Tool Call: ${name}`, parsedArgs);

    if (parsedArgs.date && parsedArgs.date.includes('2024')) {
        parsedArgs.date = parsedArgs.date.replace('2024', '2026');
    }
    switch (name) {
        case 'getMyProfile': return await getMyProfile(patientId);
        case 'updateMyProfile': return await updateMyProfile(patientId, parsedArgs);
        case 'getMyAppointments': return await getMyAppointments(patientId);
        case 'getAvailableDoctors': return await getAvailableDoctors();
        case 'getAvailableSlots': return await getAvailableSlots(parsedArgs.doctor_id, parsedArgs.date);
        case 'bookAppointment': return await bookAppointment(patientId, parsedArgs.doctor_id, parsedArgs.date, parsedArgs.time, parsedArgs.treatment);
        case 'cancelAppointment': return await cancelAppointment(patientId, parsedArgs.appointmentId);
        case 'rescheduleAppointment': return await rescheduleAppointment(patientId, parsedArgs.oldAppointmentId, parsedArgs.doctor_id, parsedArgs.date, parsedArgs.time, parsedArgs.treatment);
        case 'rescheduleMyLastAppointment': return await rescheduleMyLastAppointment(patientId, parsedArgs.doctor_id, parsedArgs.date, parsedArgs.time, parsedArgs.treatment);
        default: return { error: 'Unknown function' };
    }
}

// === THREAD MANAGEMENT ===
export const createThread = async (req, res) => {
    try {
        const thread = await openai.beta.threads.create();
        res.json({ threadId: thread.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// === PATIENT CHAT CONTROLLER ===
export const patientChat = async (req, res) => {
    const { message, threadId } = req.body;
    const userId = req.user.id;

    if (!threadId) return res.status(400).json({ error: 'threadId is required' });

    try {
        const patientId = await getPatientId(userId);

        await openai.beta.threads.messages.create(threadId, { role: "user", content: message });

        let run = await openai.beta.threads.runs.create(threadId, { assistant_id: PATIENT_ASSISTANT_ID });

        while (run.status === 'queued' || run.status === 'in_progress' || run.status === 'requires_action') {
            if (run.status === 'requires_action') {
                const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs = await Promise.all(toolCalls.map(async (tc) => ({
                    tool_call_id: tc.id,
                    output: JSON.stringify(await dispatchTool(tc.function.name, tc.function.arguments, patientId))
                })));
                run = await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, { tool_outputs: toolOutputs });
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
                run = await openai.beta.threads.runs.retrieve(threadId, run.id);
            }
        }

        const messages = await openai.beta.threads.messages.list(threadId);
        res.json({ answer: messages.data[0].content[0].text.value });
    } catch (err) {
        console.error('Patient AI Error:', err);
        res.status(500).json({ error: err.message });
    }
};