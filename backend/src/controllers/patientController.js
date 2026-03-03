import * as PatientModel from '../models/patientModel.js';

export const getAll = async (req, res) => {
    try {
        const result = await PatientModel.getAllPatients();
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getById = async (req, res) => {
    try {
        const result = await PatientModel.getPatientById(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = await PatientModel.createPatient(req.body);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const update = async (req, res) => {
    try {
        const result = await PatientModel.updatePatient(req.params.id, req.body);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await PatientModel.deletePatient(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Patient not found' });
        res.json({ message: 'Patient deleted', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
