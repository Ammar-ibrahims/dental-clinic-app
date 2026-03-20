import OpenAI from 'openai';
import pool from '../config/db.js';

// Initialize OpenAI client globally at the top level
if (!process.env.OPENAI_API_KEY) {
    console.error('CRITICAL: OPENAI_API_KEY is not configured in environment variables.');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === DATABASE TOOL FUNCTIONS ===
async function getWeeklyAppointments() {
    const result = await pool.query(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= DATE_TRUNC('week', CURRENT_DATE) AND status != 'Cancelled'`);
    return { appointments_this_week: parseInt(result.rows[0].count) };
}

async function getDoctorWorkload() {
    const result = await pool.query(`SELECT d.name as doctor_name, COUNT(a.id) as appointment_count FROM appointments a JOIN doctors d ON CAST(a.dentist_id AS TEXT) = CAST(d.id AS TEXT) WHERE DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', CURRENT_DATE) GROUP BY d.name ORDER BY appointment_count DESC LIMIT 10`);
    return { doctor_workload: result.rows };
}

async function getCommonProcedures() {
    const result = await pool.query(`SELECT COALESCE(treatment_type, 'General Checkup') as procedure_name, COUNT(*) as count FROM appointments GROUP BY treatment_type ORDER BY count DESC LIMIT 10`);
    return { common_procedures: result.rows };
}

async function getMissedAppointments() {
    const result = await pool.query(`SELECT a.id, a.appointment_date, p.name as patient_name FROM appointments a LEFT JOIN patients p ON CAST(a.patient_id AS TEXT) = CAST(p.id AS TEXT) WHERE a.status = 'Cancelled' LIMIT 20`);
    return { missed_appointments: result.rows };
}

async function getAppointmentsPerDay() {
    const result = await pool.query(`SELECT TO_CHAR(appointment_date, 'YYYY-MM-DD') as date, COUNT(*) as count FROM appointments WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY appointment_date ORDER BY appointment_date ASC`);
    return { appointments_per_day: result.rows };
}

async function getStatusBreakdown() {
    const result = await pool.query(`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`);
    return { status_breakdown: result.rows };
}

async function getAgeDistribution() {
    const result = await pool.query(`
        SELECT 
            CASE 
                WHEN age < 18 THEN '0-18'
                WHEN age >= 18 AND age <= 30 THEN '19-30'
                WHEN age >= 31 AND age <= 45 THEN '31-45'
                WHEN age >= 46 AND age <= 60 THEN '46-60'
                ELSE '61+'
            END as age_group,
            COUNT(*) as count
        FROM patients
        GROUP BY age_group
        ORDER BY age_group
    `);
    const order = ['0-18', '19-30', '31-45', '46-60', '61+'];
    const sorted = order.map(group => {
        const found = result.rows.find(r => r.age_group === group);
        return { age_group: group, count: found ? parseInt(found.count) : 0 };
    });
    return { age_distribution: sorted };
}

async function dispatchTool(name) {
    switch (name) {
        case 'getWeeklyAppointments': return await getWeeklyAppointments();
        case 'getDoctorWorkload': return await getDoctorWorkload();
        case 'getCommonProcedures': return await getCommonProcedures();
        case 'getMissedAppointments': return await getMissedAppointments();
        case 'getAppointmentsPerDay': return await getAppointmentsPerDay();
        case 'getStatusBreakdown': return await getStatusBreakdown();
        case 'getAgeDistribution': return await getAgeDistribution();
        case 'getAllPatients': return await getAllPatients();
        default: return { error: 'Unknown function' };
    }
}

async function getAllPatients() {
    const result = await pool.query(`
        SELECT id, name, email, phone, date_of_birth, gender, address 
        FROM patients 
        ORDER BY name ASC
    `);
    return { patients: result.rows };
}

// === MAIN CHAT CONTROLLER ===
export const chat = async (req, res) => {
    const { message, threadId } = req.body;

    if (!threadId) return res.status(400).json({ error: 'threadId is required' });

    try {
        // 1. Add user message to the thread
        await openai.beta.threads.messages.create(threadId, { role: "user", content: message });

        // 2. Run the assistant
        let run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.OPENAI_ASSISTANT_ID
        });

        // 3. Poll for status
        while (run.status === 'queued' || run.status === 'in_progress' || run.status === 'requires_action') {
            if (run.status === 'requires_action') {
                const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs = await Promise.all(toolCalls.map(async (tc) => {
                    const result = await dispatchTool(tc.function.name);
                    return { tool_call_id: tc.id, output: JSON.stringify(result) };
                }));
                run = await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, { tool_outputs: toolOutputs });
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
                run = await openai.beta.threads.runs.retrieve(threadId, run.id);
            }
        }

        // 4. Get the final response
        const messages = await openai.beta.threads.messages.list(threadId);
        res.json({ answer: messages.data[0].content[0].text.value });

    } catch (err) {
        console.error('Assistants API Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const createThread = async (req, res) => {
    try {
        const thread = await openai.beta.threads.create();
        res.json({ threadId: thread.id });
    } catch (err) {
        console.error("Thread creation failed:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getUsage = async (req, res) => {
    res.json({ log: [] });
};

export const getChartData = async (req, res) => {
    try {
        const [perDay, workload, status, ageDist] = await Promise.all([
            getAppointmentsPerDay(),
            getDoctorWorkload(),
            getStatusBreakdown(),
            getAgeDistribution()
        ]);
        res.json({
            appointmentsPerDay: perDay.appointments_per_day,
            doctorWorkload: workload.doctor_workload,
            statusBreakdown: status.status_breakdown,
            ageDistribution: ageDist.age_distribution
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};