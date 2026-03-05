import * as PatientSQL from '../models/patientModel.js';
import PatientMongo from '../models/Patient.js';
import mongoose from 'mongoose';

const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * @desc    GET all patients
 */
/**
 * @desc    GET all patients (Safe Version)
 */
/**
 * @desc    GET all patients (Debug & Complete Version)
 */
export const getAll = async (req, res) => {
    let sqlPatients = [];
    let mongoPatients = [];

    console.log("📡 API Call: Fetching all patients...");

    // 1. Fetch from PostgreSQL
    try {
        const sqlResult = await PatientSQL.getAllPatients();
        if (sqlResult && sqlResult.rows) {
            sqlPatients = sqlResult.rows.map(p => ({
                ...p,
                source: 'postgresql'
            }));
            console.log(`✅ SQL: Found ${sqlPatients.length} patients`);
        }
    } catch (err) {
        console.error('❌ SQL Fetch Error:', err.message);
    }

    // 2. Fetch from MongoDB
    try {
        if (mongoose.connection.readyState === 1) {
            const mongoRaw = await PatientMongo.find();
            mongoPatients = mongoRaw.map(p => ({
                id: p._id.toString(),
                name: p.fullName || 'Unnamed',
                email: p.email || '',
                phone: p.phone || '',
                age: p.age || 0,
                gender: p.gender || 'Other',
                blood_group: p.bloodGroup || 'N/A', // 👈 Added for Frontend
                address: p.address || '',           // 👈 Added for Frontend
                date_of_birth: p.dateOfBirth,       // 👈 Added for Frontend
                source: 'mongodb'
            }));
            console.log(`✅ Mongo: Found ${mongoPatients.length} patients`);
        } else {
            console.warn('⚠️ MongoDB not connected');
        }
    } catch (err) {
        console.error('❌ Mongo Fetch Error:', err.message);
    }

    const allPatients = [...sqlPatients, ...mongoPatients];
    console.log(`📊 Total patients being sent to frontend: ${allPatients.length}`);

    res.json(allPatients);
};
/**
 * @desc    GET by ID (Populates the Edit Form)
 */
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (isMongoId(id)) {
            const p = await PatientMongo.findById(id);
            if (!p) return res.status(404).json({ error: 'Not found' });

            // MAP DATABASE TO FRONTEND NAMES
            res.json({
                id: p._id.toString(),
                name: p.fullName,
                email: p.email,
                phone: p.phone,
                date_of_birth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
                gender: p.gender,
                blood_group: p.bloodGroup,
                address: p.address,
                medical_history: p.medicalHistory,
                source: 'mongodb'
            });
        } else {
            const result = await PatientSQL.getPatientById(id);
            res.json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @desc    CREATE Patient
 */
export const create = async (req, res) => {
    try {
        const dob = req.body.date_of_birth || req.body.dateOfBirth;
        let age = req.body.age || 0;
        if (dob && !req.body.age) {
            age = new Date().getFullYear() - new Date(dob).getFullYear();
        }

        const newPatient = new PatientMongo({
            fullName: req.body.name || req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            dateOfBirth: dob,
            age: age,
            gender: req.body.gender,
            bloodGroup: req.body.blood_group || req.body.bloodGroup,
            address: req.body.address,
            medicalHistory: req.body.medical_history || [],
            doctorId: req.body.assigned_doctor_id || 1
        });

        const saved = await newPatient.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * @desc    UPDATE Patient (Maps frontend names back to database)
 */
export const update = async (req, res) => {
    try {
        const { id } = req.params;

        if (isMongoId(id)) {
            // MAP FRONTEND BACK TO DATABASE NAMES
            const updateData = {
                fullName: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                dateOfBirth: req.body.date_of_birth,
                gender: req.body.gender,
                bloodGroup: req.body.blood_group,
                address: req.body.address,
                medicalHistory: req.body.medical_history
            };

            // Remove undefined fields so we don't overwrite with null
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

            const updated = await PatientMongo.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
            res.json(updated);
        } else {
            const result = await PatientSQL.updatePatient(id, req.body);
            res.json(result.rows[0]);
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * @desc    REMOVE Patient
 */
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        if (isMongoId(id)) {
            await PatientMongo.findByIdAndDelete(id);
            res.json({ message: 'Deleted from MongoDB' });
        } else {
            await PatientSQL.deletePatient(id);
            res.json({ message: 'Deleted from PostgreSQL' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};