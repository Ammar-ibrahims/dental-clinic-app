import pool from '../config/db.js';

export const getAllPatients = () =>
    pool.query('SELECT * FROM patients ORDER BY name ASC');

export const getPatientById = (id) =>
    pool.query('SELECT * FROM patients WHERE id = $1', [id]);

export const getPatientByName = (name) =>
    pool.query('SELECT * FROM patients WHERE LOWER(name) = LOWER($1) LIMIT 1', [name]);

export const createPatient = ({ name, email, phone, date_of_birth, address, medical_history, blood_group, gender }) =>
    pool.query(
        `INSERT INTO patients (name, email, phone, date_of_birth, address, medical_history, blood_group, gender)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, email, phone, date_of_birth, address, medical_history, blood_group, gender]
    );

export const updatePatient = (id, { name, email, phone, date_of_birth, address, medical_history, blood_group, gender }) =>
    pool.query(
        `UPDATE patients SET name=$1, email=$2, phone=$3, date_of_birth=$4,
     address=$5, medical_history=$6, blood_group=$7, gender=$8
     WHERE id=$9 RETURNING *`,
        [name, email, phone, date_of_birth, address, medical_history, blood_group, gender, id]
    );

export const deletePatient = (id) =>
    pool.query('DELETE FROM patients WHERE id=$1 RETURNING id', [id]);
