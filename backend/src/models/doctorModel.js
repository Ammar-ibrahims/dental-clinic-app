import pool from '../config/db.js';

export const getAllDoctors = () =>
    pool.query('SELECT * FROM dentists WHERE is_active = true ORDER BY name ASC');

export const getDoctorById = (id) =>
    pool.query('SELECT * FROM dentists WHERE id = $1', [id]);

export const createDoctor = ({ name, specialty, email, contact, bio, years_experience, availability, profile_image_url }) =>
    pool.query(
        `INSERT INTO dentists (name, specialty, email, contact, bio, years_experience, availability, profile_image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, specialty, email, contact, bio, years_experience, availability, profile_image_url]
    );

export const updateDoctor = (id, { name, specialty, email, contact, bio, years_experience, availability, is_active }) =>
    pool.query(
        `UPDATE dentists SET name=$1, specialty=$2, email=$3, contact=$4,
     bio=$5, years_experience=$6, availability=$7, is_active=$8
     WHERE id=$9 RETURNING *`,
        [name, specialty, email, contact, bio, years_experience, availability, is_active, id]
    );

export const deleteDoctor = (id) =>
    pool.query('UPDATE dentists SET is_active=false WHERE id=$1 RETURNING id', [id]);
