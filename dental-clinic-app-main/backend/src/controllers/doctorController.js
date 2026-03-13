import * as DoctorModel from '../models/doctorModel.js';

export const getAll = async (req, res) => {
    try {
        const result = await DoctorModel.getAllDoctors();
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getById = async (req, res) => {
    try {
        const result = await DoctorModel.getDoctorById(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Doctor not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = await DoctorModel.createDoctor(req.body);
        // Important: Return the whole row so the frontend gets the new ID
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Create Doctor Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

export const update = async (req, res) => {
    try {
        const result = await DoctorModel.updateDoctor(req.params.id, req.body);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Doctor not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        // Soft delete: set is_active to false
        const result = await DoctorModel.deleteDoctor(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Doctor not found' });
        res.json({ message: 'Doctor deactivated successfully', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};