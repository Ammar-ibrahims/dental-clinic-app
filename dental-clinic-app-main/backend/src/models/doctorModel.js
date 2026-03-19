import pool from '../config/db.js';

export const getAllDoctors = () =>
    pool.query('SELECT * FROM doctors WHERE is_active = true ORDER BY name ASC');

export const getDoctorById = (id) =>
    pool.query('SELECT * FROM doctors WHERE id = $1', [id]);

export const createDoctor = ({ name, specialty, email, contact, bio, years_experience, availability, profile_image_url }) =>
    pool.query(
        `INSERT INTO doctors (name, specialty, email, contact, bio, years_experience, availability, profile_image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, specialty, email, contact, bio, years_experience, availability, profile_image_url]
    );

export const updateDoctor = (id, { name, specialty, email, contact, bio, years_experience, availability, is_active }) =>
    pool.query(
        `UPDATE doctors SET name=$1, specialty=$2, email=$3, contact=$4,
     bio=$5, years_experience=$6, availability=$7, is_active=$8
     WHERE id=$9 RETURNING *`,
        [name, specialty, email, contact, bio, years_experience, availability, is_active, id]
    );

export const deleteDoctor = (id) =>
    pool.query('DELETE FROM doctors WHERE id = $1 RETURNING id', [id]);

export const getDoctorTokens = (id) =>
    pool.query('SELECT google_access_token, google_refresh_token, google_token_expiry FROM doctors WHERE id=$1', [id]);
