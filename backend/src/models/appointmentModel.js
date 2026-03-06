import pool from '../config/db.js';

export const getAllAppointments = () =>
    pool.query(`
    SELECT
      a.*,
      d.name  AS dentist_name,
      d.specialty
    FROM appointments a
    JOIN dentists d ON a.dentist_id = d.id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `);

export const getAppointmentById = (id) =>
    pool.query(
        `SELECT a.*, d.name AS dentist_name
     FROM appointments a
     JOIN dentists d ON a.dentist_id = d.id
     WHERE a.id = $1`,
        [id]
    );

/**
 * Check if a dentist already has an active (non-Cancelled) appointment
 * at the given date and time.  Returns the conflicting row if one exists.
 */
export const checkConflict = (dentist_id, appointment_date, appointment_time) =>
    pool.query(
        `SELECT id FROM appointments
     WHERE dentist_id = $1
       AND appointment_date = $2
       AND appointment_time = $3
       AND status != 'Cancelled'
     LIMIT 1`,
        [dentist_id, appointment_date, appointment_time]
    );

/**
 * Return all booked (non-Cancelled) time slots for a dentist on a given date.
 */
export const getBookedSlots = (dentist_id, date) =>
    pool.query(
        `SELECT appointment_time
     FROM appointments
     WHERE dentist_id = $1
       AND appointment_date = $2
       AND status != 'Cancelled'
     ORDER BY appointment_time`,
        [dentist_id, date]
    );

export const createAppointment = ({ patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status, timezone, google_event_id }) =>
    pool.query(
        `INSERT INTO appointments (patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status, timezone, google_event_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status || 'Pending', timezone || 'Asia/Karachi', google_event_id]
    );

export const updateGoogleEventId = (id, eventId) =>
    pool.query('UPDATE appointments SET google_event_id=$1 WHERE id=$2 RETURNING *', [eventId, id]);

export const updateAppointmentStatus = (id, status) =>
    pool.query('UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *', [status, id]);

export const deleteAppointment = (id) =>
    pool.query('DELETE FROM appointments WHERE id=$1 RETURNING id', [id]);
