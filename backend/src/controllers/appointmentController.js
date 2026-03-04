import * as AppointmentModel from '../models/appointmentModel.js';
import * as DoctorModel from '../models/doctorModel.js';
import * as PatientModel from '../models/patientModel.js';
import * as googleCalendarService from '../services/googleCalendarService.js';

export const getAll = async (req, res) => {
    try {
        const result = await AppointmentModel.getAllAppointments();
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getById = async (req, res) => {
    try {
        const result = await AppointmentModel.getAppointmentById(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Appointment not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const create = async (req, res) => {
    const { dentist_id, patient_id, appointment_date, appointment_time, timezone } = req.body;
    const tz = timezone || 'Asia/Karachi';
    try {
        // 1. Check local DB conflict
        const localConflict = await AppointmentModel.checkConflict(
            dentist_id, appointment_date, appointment_time
        );
        if (localConflict.rows.length > 0) {
            return res.status(409).json({
                error: 'This time slot is already booked in the local system. Please choose another time.',
            });
        }

        // 2. Check Google Calendar conflict
        let tokens = null;
        let isGoogleConnected = false;
        const doctorTokensData = await DoctorModel.getDoctorTokens(dentist_id);

        if (doctorTokensData.rows.length > 0) {
            const row = doctorTokensData.rows[0];
            if (row.google_access_token && row.google_refresh_token) {
                isGoogleConnected = true;
                tokens = {
                    access_token: row.google_access_token,
                    refresh_token: row.google_refresh_token,
                    expiry_date: row.google_token_expiry,
                };
            }
        }

        if (isGoogleConnected) {
            // Check Google Calendar busy specific to this 30-min slot
            // Calculate slot start/end in UTC assuming the clinic works in local time.
            // For simplicity, we assume the user's local timezone. We need an exact ISO.
            // Let's create an ISO string for the requested time.
            const startStr = `${appointment_date}T${appointment_time}`; // e.g. 2026-03-05T09:00
            const startDate = new Date(startStr);
            const endDate = new Date(startDate.getTime() + 30 * 60000); // +30 mins

            const timeMin = startDate.toISOString();
            const timeMax = endDate.toISOString();

            const busyPeriods = await googleCalendarService.getBusyPeriods(tokens, timeMin, timeMax);
            if (busyPeriods.length > 0) {
                return res.status(409).json({
                    error: "This time slot is occupied on the dentist's Google Calendar. Please choose another time.",
                });
            }
        }

        // 3. Create local appointment
        const result = await AppointmentModel.createAppointment(req.body);
        const newAppointment = result.rows[0];

        // 4. Also create event in Google Calendar if connected
        if (isGoogleConnected) {
            try {
                // Fetch patient details for the event title
                const patientResult = await PatientModel.getPatientById(patient_id);
                const patientName = patientResult.rows[0]?.name || 'Patient';

                // Ensure time has seconds for proper ISO formatting
                const timeStr = appointment_time.length === 5 ? `${appointment_time}:00` : appointment_time;
                // Send explicit PKT offset (+05:00) directly to Google Calendar.
                // We calculate the end time string directly rather than using Date objects which shift to UTC.
                const startHour = parseInt(appointment_time.slice(0, 2), 10);
                const startMin = parseInt(appointment_time.slice(3, 5), 10);

                let endHour = startHour;
                let endMin = startMin + 30;
                if (endMin >= 60) {
                    endHour += 1;
                    endMin -= 60;
                }

                const endHourStr = endHour.toString().padStart(2, '0');
                const endMinStr = endMin.toString().padStart(2, '0');

                const startDateTimeStr = `${appointment_date}T${timeStr}`;
                const endDateTimeStr = `${appointment_date}T${endHourStr}:${endMinStr}:00`;

                await googleCalendarService.createEvent(tokens, {
                    summary: `Dental Appointment - ${patientName}`,
                    description: `Treatment: ${req.body.treatment_type || 'N/A'}\nNotes: ${req.body.notes || ''}`,
                    start: { dateTime: startDateTimeStr, timeZone: tz },
                    end: { dateTime: endDateTimeStr, timeZone: tz },
                });
            } catch (err) {
                console.error('Failed to sync appointment with Google Calendar:', err);
                // We don't fail the request since local booking succeeded
            }
        }

        res.status(201).json(newAppointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

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

/**
 * GET /api/appointments/slots?dentist_id=X&date=YYYY-MM-DD
 * Returns the list of booked time slots for a dentist on a given date.
 * Combines local DB + Google Calendar (if connected).
 */
export const getAvailableSlots = async (req, res) => {
    const { dentist_id, date, timezone } = req.query; // date is YYYY-MM-DD
    if (!dentist_id || !date) {
        return res.status(400).json({ error: 'dentist_id and date query params are required' });
    }
    const tz = timezone || 'Asia/Karachi';
    try {
        // 1. Get locally booked slots
        const result = await AppointmentModel.getBookedSlots(dentist_id, date);
        const bookedSlots = result.rows.map((r) => r.appointment_time.slice(0, 5)); // "09:00:00" -> "09:00"

        // 2. Check Google Calendar busy blocks if connected
        const doctorTokensData = await DoctorModel.getDoctorTokens(dentist_id);
        if (doctorTokensData.rows.length > 0) {
            const row = doctorTokensData.rows[0];
            if (row.google_access_token && row.google_refresh_token) {
                const tokens = {
                    access_token: row.google_access_token,
                    refresh_token: row.google_refresh_token,
                    expiry_date: row.google_token_expiry,
                };

                // Query spanning 3 days (UTC) to ensure we perfectly cover the local date regardless of timezone offset
                const timeMin = new Date(`${date}T00:00:00Z`);
                timeMin.setDate(timeMin.getDate() - 1);
                const timeMax = new Date(`${date}T23:59:59Z`);
                timeMax.setDate(timeMax.getDate() + 1);

                // Ask Google for busy periods CONVERTED to the requested timezone
                const busyPeriods = await googleCalendarService.getBusyPeriods(tokens, timeMin.toISOString(), timeMax.toISOString(), tz);

                // Possible clinic slots: 09:00, 09:30, 10:00 ... 16:30
                const possibleSlots = [];
                for (let h = 9; h <= 16; h++) {
                    possibleSlots.push(`${h.toString().padStart(2, '0')}:00`);
                    possibleSlots.push(`${h.toString().padStart(2, '0')}:30`);
                }

                // If a possible slot intersects with ANY Google busy period, add it to 'bookedSlots'
                busyPeriods.forEach(period => {
                    // Because we requested `timeZone: tz`, Google responds with `2026-03-05T09:30:00-05:00`
                    // We slice the first 19 chars to get the exact local time `2026-03-05T09:30:00` natively 
                    const googleStartStr = period.start.slice(0, 19);
                    const googleEndStr = period.end.slice(0, 19);

                    possibleSlots.forEach(slotTime => {
                        const slotStartStr = `${date}T${slotTime}:00`;

                        // Calculate end string manually
                        const sh = parseInt(slotTime.slice(0, 2), 10);
                        const sm = parseInt(slotTime.slice(3, 5), 10);
                        let eh = sh;
                        let em = sm + 30;
                        if (em >= 60) { eh += 1; em -= 60; }
                        const slotEndStr = `${date}T${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}:00`;

                        // String-based overlap comparison alphabetically (guarantees local timezone accuracy)
                        // (slotStart < googleEnd) && (slotEnd > googleStart)
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
