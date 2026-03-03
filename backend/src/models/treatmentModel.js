import pool from '../config/db.js';

export const getAllTreatments = () =>
    pool.query('SELECT * FROM treatments ORDER BY name ASC');

export const getTreatmentById = (id) =>
    pool.query('SELECT * FROM treatments WHERE id = $1', [id]);
