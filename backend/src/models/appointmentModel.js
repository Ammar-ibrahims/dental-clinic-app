import pool from '../config/db.js';

export const getAllAppointments = () =>
    pool.query(`
    SELECT
      a.*,
      p.name  AS patient_name,
      p.phone AS patient_phone,
      d.name  AS dentist_name,
      d.specialty
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN dentists d ON a.dentist_id = d.id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `);

export const getAppointmentById = (id) =>
    pool.query(
        `SELECT a.*, p.name AS patient_name, d.name AS dentist_name
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN dentists d ON a.dentist_id = d.id
     WHERE a.id = $1`,
        [id]
    );

export const createAppointment = ({ patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status }) =>
    pool.query(
        `INSERT INTO appointments (patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [patient_id, dentist_id, appointment_date, appointment_time, treatment_type, notes, status || 'Pending']
    );

export const updateAppointmentStatus = (id, status) =>
    pool.query('UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *', [status, id]);

export const deleteAppointment = (id) =>
    pool.query('DELETE FROM appointments WHERE id=$1 RETURNING id', [id]);
