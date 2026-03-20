import OpenAI from 'openai';
import pool from '../config/db.js';
import * as AppointmentModel from '../models/appointmentModel.js';
import * as PatientModel from '../models/patientModel.js';
import * as DoctorModel from '../models/doctorModel.js';
import * as appointmentSyncService from '../services/appointmentSyncService.js';
import * as googleCalendarService from '../services/googleCalendarService.js';
import { addSubscriberToGroup } from '../services/mailerLiteService.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PATIENT_ASSISTANT_ID = process.env.PATIENT_ASSISTANT_ID;

/**
 * Helper to get patient ID from the users table ID
 */
async function getPatientId(userId) {
    const result = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) throw new Error('Patient profile not found');
    return result.rows[0].id;
}

/**
 * Creates a new thread for OpenAI Assistant
 */
export const createThread = async (req, res) => {
    try {
        const thread = await openai.beta.threads.create();
        res.json({ threadId: thread.id });
    } catch (err) {
        console.error("❌ Error creating thread:", err.message);
        res.status(500).json({ error: "Failed to create thread" });
    }
};

/**
 * Handle AI interactions for patients
 */
export const patientChat = async (req, res) => {
    const { message, threadId } = req.body;
    const userId = req.user.id;

    try {
        const patientId = await getPatientId(userId);
        
        // 1. Ensure thread exists
        let activeThreadId = threadId;
        if (!activeThreadId) {
            const thread = await openai.beta.threads.create();
            activeThreadId = thread.id;
        }

        // 2. Add message to thread
        await openai.beta.threads.messages.create(activeThreadId, {
            role: "user",
            content: message
        });

        // 3. Run assistant
        let run = await openai.beta.threads.runs.createAndPoll(activeThreadId, {
            assistant_id: PATIENT_ASSISTANT_ID
        });

        // 4. Handle multiple rounds of tool calls in a loop
        const MAX_ROUNDS = 10;
        let rounds = 0;
        while (run.status === 'requires_action' && rounds < MAX_ROUNDS) {
            rounds++;
            const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
            const toolOutputs = [];

            for (const toolCall of toolCalls) {
                console.log(`🤖 AI Tool Call (round ${rounds}): ${toolCall.function.name} ${toolCall.function.arguments}`);
                const args = JSON.parse(toolCall.function.arguments);
                const output = await dispatchTool(toolCall.function.name, args, patientId);
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(output)
                });
            }

            // Submit tool outputs and poll again — run may enter requires_action again
            run = await openai.beta.threads.runs.submitToolOutputsAndPoll(activeThreadId, run.id, {
                tool_outputs: toolOutputs
            });
        }

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(activeThreadId);
            const lastMessage = messages.data[0].content[0].text.value;
            return res.json({ response: lastMessage, threadId: activeThreadId });
        }

        console.error(`❌ Run ended with status: ${run.status}`);
        res.status(500).json({ error: `Assistant run ended with status: ${run.status}` });
    } catch (err) {
        console.error("❌ AI Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

async function bookAppointment(patientId, doctor_id, date, time, treatment) {
    // 1. Auto-cleanup: If booking for same doctor on same day, delete old one FIRST
    // This allows the "Reschedule" request to work even if AI just calls bookAppointment again.
    try {
        const existing = await pool.query(
            "SELECT id FROM appointments WHERE patient_id = $1 AND dentist_id = $2 AND appointment_date = $3",
            [patientId, doctor_id, date]
        );
        
        if (existing.rows.length > 0) {
            const row = existing.rows[0];
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

    // 3. Sync to Google (Await it to ensure it completes before response)
    console.log(`📡 BOOKING: Starting Google Sync for Appt ${newAppt.id}...`);
    await appointmentSyncService.syncAppointmentToGoogle(newAppt.id);
    return { success: true, appointment: newAppt };
}

async function cancelAppointment(patientId, appointmentId) {
    // 1. Delete from Google Calendar first (needs DB to find event ID)
    await appointmentSyncService.deleteGoogleEvent(appointmentId);

    // 2. Hard delete from DB as requested by the user
    await AppointmentModel.deleteAppointment(appointmentId);

    return { success: true, message: "Appointment deleted from database and Google Calendar." };
}

async function getMyProfile(patientId) {
    const result = await pool.query("SELECT * FROM patients WHERE id = $1", [patientId]);
    if (result.rows.length === 0) return { error: "Profile not found" };
    return { success: true, profile: result.rows[0] };
}

async function updateMyProfile(patientId, updates) {
    const allowed = ['name', 'email', 'phone', 'age', 'address', 'gender', 'blood_group', 'medical_history'];
    const filtered = {};
    allowed.forEach(k => { if (updates[k] !== undefined) filtered[k] = updates[k]; });
    
    if (Object.keys(filtered).length === 0) return { error: "No valid fields to update" };

    // Fetch existing to avoid wiping document_url
    const existing = await PatientModel.getPatientById(patientId);
    if (existing.rows.length === 0) return { error: "Profile not found" };
    const p = existing.rows[0];

    const finalData = { ...p, ...filtered };
    const result = await PatientModel.updatePatient(patientId, finalData);
    return { success: true, message: "Profile updated successfully", profile: result.rows[0] };
}

async function rescheduleAppointment(patientId, oldAppointmentId, doctor_id, date, time, treatment) {
    try {
        // 1. Delete old appointment from Google Calendar
        await appointmentSyncService.deleteGoogleEvent(oldAppointmentId);

        // 2. Delete old appointment from DB
        await AppointmentModel.deleteAppointment(oldAppointmentId);

        // 3. Book new appointment
        return await bookAppointment(patientId, doctor_id, date, time, treatment);
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function rescheduleMyLastAppointment(patientId, doctor_id, date, time, treatment) {
    try {
        // 1. Find the latest appointment for this patient
        const res = await pool.query(
            "SELECT id FROM appointments WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1",
            [patientId]
        );

        if (res.rows.length === 0) {
            // If no appointment found, just book a new one
            return await bookAppointment(patientId, doctor_id, date, time, treatment);
        }

        const oldId = res.rows[0].id;
        console.log(`🔄 Rescheduling last appointment (ID: ${oldId}) to ${date} ${time}`);

        // 2. Cancel the old one
        await appointmentSyncService.deleteGoogleEvent(oldId);
        await AppointmentModel.deleteAppointment(oldId);

        // 3. Book the new one
        return await bookAppointment(patientId, doctor_id, date, time, treatment);
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function dispatchTool(name, args, patientId) {
    try {
        switch (name) {
            case 'getAvailableDoctors':
                const doctors = await pool.query('SELECT id, name, specialty FROM doctors');
                return doctors.rows;

            case 'getAvailableSlots': {
                const dentistId = args.doctor_id;
                const date = args.date;
                const tzOffset = '+05:00';
                const tzName = 'Asia/Karachi';

                // Get booked slots from local DB
                const dbResult = await AppointmentModel.getBookedSlots(dentistId, date);
                const localBookedSlots = dbResult.rows.map(r => r.appointment_time.slice(0, 5));

                // Define clinic hours (9 AM to 5 PM, 30-min increments)
                let clinicSlots = [];
                for (let h = 9; h <= 16; h++) {
                    clinicSlots.push(`${h.toString().padStart(2, '0')}:00`);
                    clinicSlots.push(`${h.toString().padStart(2, '0')}:30`);
                }

                // Check Google Calendar for busy periods
                let googleBusySlots = [];
                try {
                    const doctorTokensData = await DoctorModel.getDoctorTokens(dentistId);
                    if (doctorTokensData.rows.length > 0) {
                        const row = doctorTokensData.rows[0];
                        if (row.google_access_token && row.google_refresh_token) {
                            const tokens = {
                                access_token: row.google_access_token,
                                refresh_token: row.google_refresh_token,
                                expiry_date: Number(row.google_token_expiry)
                            };
                            const timeMin = `${date}T00:00:00Z`;
                            const timeMax = `${date}T23:59:59Z`;
                            const busyPeriods = await googleCalendarService.getBusyPeriods(tokens, timeMin, timeMax, tzName);
                            clinicSlots.forEach(slotTime => {
                                const slotStart = new Date(`${date}T${slotTime}:00${tzOffset}`).getTime();
                                const slotEnd = slotStart + (30 * 60000);
                                const isBusy = busyPeriods.some(p => {
                                    const gStart = new Date(p.start).getTime();
                                    const gEnd = new Date(p.end).getTime();
                                    return slotStart < gEnd && slotEnd > gStart;
                                });
                                if (isBusy) googleBusySlots.push(slotTime);
                            });
                        }
                    }
                } catch (gcErr) {
                    console.warn('⚠️ Google Calendar check failed, using local DB only:', gcErr.message);
                }

                // Filter out booked/busy/past slots
                const nowPKT = new Date();
                const nowPKTTime = nowPKT.getTime();
                const todayStr = nowPKT.toISOString().split('T')[0];

                const availableSlots = clinicSlots.filter(slot => {
                    if (localBookedSlots.includes(slot) || googleBusySlots.includes(slot)) return false;
                    if (date === todayStr) {
                        const slotAbsoluteTime = new Date(`${date}T${slot}:00${tzOffset}`).getTime();
                        return slotAbsoluteTime > nowPKTTime;
                    }
                    return true;
                });

                console.log(`Slots for ${date}: Found ${availableSlots.length} free slots.`);
                return { dentist_id: parseInt(dentistId), date, available_slots: availableSlots };
            }

            case 'bookAppointment':
                return await bookAppointment(patientId, args.doctor_id, args.date, args.time, args.treatment);

            case 'cancelAppointment':
                return await cancelAppointment(patientId, args.appointmentId);

            case 'rescheduleAppointment':
                return await rescheduleAppointment(patientId, args.oldAppointmentId, args.doctor_id, args.date, args.time, args.treatment);
            
            case 'rescheduleMyLastAppointment':
                return await rescheduleMyLastAppointment(patientId, args.doctor_id, args.date, args.time, args.treatment);

            case 'getMyProfile':
                return await getMyProfile(patientId);

            case 'updateMyProfile':
                return await updateMyProfile(patientId, args);

            default:
                throw new Error(`Tool ${name} not found`);
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
}