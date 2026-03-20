import pool from '../config/db.js';

export const getAllPatients = () =>
    pool.query('SELECT * FROM patients ORDER BY name ASC');

export const getPatientById = (id) =>
    pool.query('SELECT * FROM patients WHERE id = $1', [parseInt(id)]);

export const getPatientByName = (name) =>
    pool.query('SELECT * FROM patients WHERE LOWER(name) = LOWER($1) LIMIT 1', [name]);

export const createPatient = ({ name, email, phone, date_of_birth, age, address, medical_history, blood_group, gender, document_url }) =>
    pool.query(
        `INSERT INTO patients (name, email, phone, date_of_birth, age, address, medical_history, blood_group, gender, document_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [name, email, phone, date_of_birth, age, address, medical_history, blood_group, gender, document_url]
    );

export const updatePatient = (id, { name, email, phone, date_of_birth, age, address, medical_history, blood_group, gender, document_url }) =>
    pool.query(
        `UPDATE patients SET name=$1, email=$2, phone=$3, date_of_birth=$4, age=$5,
     address=$6, medical_history=$7, blood_group=$8, gender=$9, document_url=$10
     WHERE id=$11 RETURNING *`,
        [name, email, phone, date_of_birth, age, address, medical_history, blood_group, gender, document_url, id]
    );

export const deletePatient = (id) =>
    pool.query('DELETE FROM patients WHERE id=$1 RETURNING id', [id]);
