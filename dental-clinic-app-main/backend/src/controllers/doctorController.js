import * as DoctorModel from '../models/doctorModel.js';
import * as upstash from '../services/upstashService.js';

const DOCTORS_CACHE_KEY = 'all_doctors';

export const getAll = async (req, res) => {
    try {
        const cached = await upstash.getCache(DOCTORS_CACHE_KEY);
        if (cached) {
            console.log('✅ Serving doctors from Upstash cache');
            return res.json(cached);
        }
        const result = await DoctorModel.getAllDoctors();
        await upstash.setCache(DOCTORS_CACHE_KEY, result.rows, 1800); // 30 min
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getById = async (req, res) => {
    try {
        const cacheKey = `doctor:${req.params.id}`;
        const cached = await upstash.getCache(cacheKey);
        if (cached) return res.json(cached);

        const result = await DoctorModel.getDoctorById(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Doctor not found' });

        await upstash.setCache(cacheKey, result.rows[0], 1800);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const create = async (req, res) => {
    try {
        const result = await DoctorModel.createDoctor(req.body);
        // Invalidate list cache
        await upstash.delCache(DOCTORS_CACHE_KEY);
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
        // Invalidate caches
        await Promise.all([
            upstash.delCache(DOCTORS_CACHE_KEY),
            upstash.delCache(`doctor:${req.params.id}`)
        ]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        const result = await DoctorModel.deleteDoctor(req.params.id);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Doctor not found' });
        // Invalidate caches
        await Promise.all([
            upstash.delCache(DOCTORS_CACHE_KEY),
            upstash.delCache(`doctor:${req.params.id}`)
        ]);
        res.json({ message: 'Doctor deactivated successfully', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};