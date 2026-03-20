import * as PatientSQL from '../models/patientModel.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';
import { getPresignedUrl } from '../services/uploadService.js';
import pool from '../config/db.js';
import * as upstash from '../services/upstashService.js';

const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
const PATIENTS_CACHE_KEY = 'all_patients';

/**
 * @desc    GET all patients (Fixed: No more duplicates)
 */
export const getAll = async (req, res) => {
    try {
        console.log("📡 API Call: Fetching patients (checking cache)...");

        const cached = await upstash.getCache(PATIENTS_CACHE_KEY);
        if (cached) {
            console.log('✅ Serving patients from Upstash cache');
            return res.json(cached);
        }

        const sqlResult = await PatientSQL.getAllPatients();

        if (!sqlResult || !sqlResult.rows) {
            return res.json([]);
        }

        const patients = await Promise.all(sqlResult.rows.map(async (p) => ({
            id: p.id,
            mongo_id: p.mongo_id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            age: p.age,
            document_url: p.document_url ? await getPresignedUrl(p.document_url) : "",
            source: 'postgresql'
        })));

        // Cache for 30 minutes
        await upstash.setCache(PATIENTS_CACHE_KEY, patients, 1800);

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
        const { age, ...rest } = req.body;
        const documentUrl = req.file ? req.file.location : "";
        const parsedAge = (age !== undefined && age !== '') ? parseInt(age) : null;
        const newPatient = new PatientMongo({ ...rest, age: parsedAge, documentUrl });
        const savedMongo = await newPatient.save();

        try {
            await PatientSQL.createPatient({
                ...rest,
                age: parsedAge,
                mongo_id: savedMongo._id.toString(),
                document_url: documentUrl
            });
        } catch (sqlErr) { console.error("❌ SQL Save Error:", sqlErr.message); }

        // Invalidate patient list cache
        await upstash.delCache(PATIENTS_CACHE_KEY);

        res.status(201).json(savedMongo);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { age, ...rest } = req.body;
        const documentUrl = req.file ? req.file.location : null;
        const parsedAge = (age !== undefined && age !== '' && age !== null) ? parseInt(age) : null;
        if (isMongoId(id)) {
            const updateData = { ...rest };
            updateData.age = parsedAge;
            if (documentUrl) {
                updateData.documentUrl = documentUrl;
            } else if (req.body.delete_current_file === 'true') {
                updateData.documentUrl = "";
            }
            const updated = await PatientMongo.findByIdAndUpdate(id, updateData, { new: true });
            res.json(updated);
        } else {
            console.log(`📝 Updating SQL Patient ID: ${id}`);
            // Fetch existing to preserve document_url if not changing
            const existingRes = await PatientSQL.getPatientById(id);
            if (existingRes.rows.length === 0) {
                console.error(`❌ SQL Patient ID ${id} not found`);
                return res.status(404).json({ error: 'Patient record not found in SQL database' });
            }
            const p = existingRes.rows[0];

            let finalDocUrl = documentUrl;
            if (finalDocUrl === null) {
                if (req.body.delete_current_file === 'true') {
                    finalDocUrl = "";
                } else {
                    finalDocUrl = p.document_url; // Preserve existing
                }
            }

            const result = await PatientSQL.updatePatient(id, {
                ...rest,
                age: parsedAge,
                document_url: finalDocUrl
            });
            
            if (result.rows.length === 0) {
                throw new Error("Update failed: No rows returned from SQL update");
            }
            console.log(`✅ SQL Patient ID ${id} updated successfully`);
            res.json(result.rows[0]);
        }
    } catch (err) { 
        console.error("❌ Patient Update Error:", err);
        res.status(400).json({ error: err.message }); 
    }
};

export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        let postgresId = null;
        let mongoId = null;
        let targetEmail = null;

        if (isMongoId(id)) {
            mongoId = id;
            try {
                const mongoPatient = await PatientMongo.findById(mongoId);
                if (mongoPatient) targetEmail = mongoPatient.email;
            } catch (err) {}
            
            if (targetEmail) {
                const result = await PatientSQL.getAllPatients();
                const p = result.rows.find(row => row.email === targetEmail);
                if (p) postgresId = p.id;
            }
        } else {
            postgresId = id;
            try {
                const pRes = await PatientSQL.getPatientById(id);
                if (pRes.rows.length > 0) targetEmail = pRes.rows[0].email;
            } catch (err) {}
            
            if (targetEmail) {
                 const mongoPatient = await PatientMongo.findOne({ email: targetEmail });
                 if (mongoPatient) mongoId = mongoPatient._id;
            }
        }

        // 1. Delete from MongoDB
        try {
           if (mongoId) await PatientMongo.findByIdAndDelete(mongoId);
        } catch (err) { console.error("MongoDB delete error:", err.message) }

        // 2. Delete from PostgreSQL
        try {
            if (postgresId) await PatientSQL.deletePatient(postgresId);
        } catch (err) { console.error("PostgreSQL delete error:", err.message) }

        // Invalidate patient list cache
        await upstash.delCache(PATIENTS_CACHE_KEY);
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

        const p = result.rows[0];
        if (p.document_url) {
            p.document_url = await getPresignedUrl(p.document_url);
        }

        res.json(p);
    } catch (err) {
        console.error("Error in getMyProfile:", err); // Added logging to help debug future issues
        res.status(500).json({ error: err.message });
    }
};