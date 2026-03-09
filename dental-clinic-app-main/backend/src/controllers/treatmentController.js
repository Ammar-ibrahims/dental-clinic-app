import * as TreatmentModel from '../models/treatmentModel.js';

export const getAll = async (req, res) => {
    try {
        const result = await TreatmentModel.getAllTreatments();
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
