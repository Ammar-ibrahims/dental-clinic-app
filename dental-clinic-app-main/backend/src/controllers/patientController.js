import * as PatientSQL from '../models/patientModel.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';
import { getPresignedUrl } from '../services/uploadService.js';
import pool from '../config/db.js'; // <--- ADD THIS LINE

const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * @desc    GET all patients (Fixed: No more duplicates)
 */
export const getAll = async (req, res) => {
    try {
        console.log("📡 API Call: Fetching patients from PostgreSQL...");

        // 1. Fetch only from PostgreSQL (The Master List)
        const sqlResult = await PatientSQL.getAllPatients();

        if (!sqlResult || !sqlResult.rows) {
            return res.json([]);
        }

        // 2. Generate secure S3 links for the list
        const patients = await Promise.all(sqlResult.rows.map(async (p) => ({
            id: p.id,
            mongo_id: p.mongo_id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            // Use the document_url from Postgres and sign it
            document_url: p.document_url ? await getPresignedUrl(p.document_url) : "",
            source: 'postgresql'
        })));

        console.log(`✅ Sent ${patients.length} unique patients to frontend`);
        res.json(patients);

    } catch (err) {
        console.error('❌ Fetch Error:', err.message);
        res.status(500).json({ error: "Could not fetch patients" });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        if (isMongoId(id)) {
            const p = await PatientMongo.findById(id);
            if (!p) return res.status(404).json({ error: 'Not found' });
            const secureUrl = p.documentUrl ? await getPresignedUrl(p.documentUrl) : "";
            res.json({ ...p._doc, id: p._id.toString(), document_url: secureUrl });
        } else {
            const result = await PatientSQL.getPatientById(id);
            const p = result.rows[0];
            if (p) p.document_url = p.document_url ? await getPresignedUrl(p.document_url) : "";
            res.json(p);
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const create = async (req, res) => {
    try {
        const documentUrl = req.file ? req.file.location : "";
        const newPatient = new PatientMongo({ ...req.body, documentUrl });
        const savedMongo = await newPatient.save();

        try {
            await PatientSQL.createPatient({
                ...req.body,
                mongo_id: savedMongo._id.toString(),
                document_url: documentUrl
            });
        } catch (sqlErr) { console.error("❌ SQL Save Error:", sqlErr.message); }

        res.status(201).json(savedMongo);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const documentUrl = req.file ? req.file.location : null;
        if (isMongoId(id)) {
            const updateData = { ...req.body };
            if (documentUrl) updateData.documentUrl = documentUrl;
            const updated = await PatientMongo.findByIdAndUpdate(id, updateData, { new: true });
            res.json(updated);
        } else {
            const result = await PatientSQL.updatePatient(id, { ...req.body, document_url: documentUrl });
            res.json(result.rows[0]);
        }
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (isMongoId(id)) {
            await PatientMongo.findByIdAndDelete(id);
        } else {
            await PatientSQL.deletePatient(id);
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * @desc    GET current logged-in patient profile
 */
/**
 * @desc    GET current logged-in patient profile
 */
export const getMyProfile = async (req, res) => {
    try {
        // req.user.id comes from the 'authorize' middleware token
        const userId = req.user.id;

        // Find the patient linked to this user_id using the direct pool import
        const result = await pool.query( // <--- FIXED THIS LINE
            'SELECT * FROM patients WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Patient profile not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error in getMyProfile:", err); // Added logging to help debug future issues
        res.status(500).json({ error: err.message });
    }
};