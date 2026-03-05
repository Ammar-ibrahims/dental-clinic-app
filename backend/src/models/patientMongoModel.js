import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    medicalHistory: {
        type: [String],
        default: [],
    },
    assignedDoctorId: {
        type: String, // Referencing PostgreSQL Doctor ID (String or Number depending on type)
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Duplicate the _id field to 'id' for frontend/SQL compatibility
patientSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const PatientMongo = mongoose.model('Patient', patientSchema);

export default PatientMongo;
