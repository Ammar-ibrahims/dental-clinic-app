import * as AppointmentModel from '../models/appointmentModel.js';

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
    try {
        const result = await AppointmentModel.createAppointment(req.body);
        res.status(201).json(result.rows[0]);
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
