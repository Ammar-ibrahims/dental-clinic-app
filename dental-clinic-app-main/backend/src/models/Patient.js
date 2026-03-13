import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    documentUrl: { type: String, default: "" },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: false
    },
    date_of_birth: Date,
    gender: String,
    blood_group: String,
    address: String,
    medical_history: String
}, { timestamps: true });

export default mongoose.model('Patient', patientSchema);