import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema({
    diagnosis: { type: String, required: true },
    treatment: { type: String },
    date: { type: Date, default: Date.now }
});

const patientSchema = new mongoose.Schema({
    fullName: { type: String, required: [true, 'Full name is required'] },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phone: { type: String, required: [true, 'Phone number is required'] },
    age: { type: Number, min: [0, 'Age cannot be negative'] },
    gender: {
        type: String,
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: '{VALUE} is not a supported gender'
        }
    },
    bloodGroup: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    medicalHistory: [medicalHistorySchema],
    doctorId: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('Patient', patientSchema);