import 'dotenv/config';
import mongoose from 'mongoose';
import Patient from './src/models/Patient.js';

const samplePatients = [
    {
        fullName: "Ali Ahmed",
        email: "ali.ahmed@example.com",
        phone: "0300-1234567",
        age: 34,
        gender: "Male",
        bloodGroup: "B+",
        address: "Lahore, Pakistan",
        dateOfBirth: new Date("1990-05-15"),
        medicalHistory: [
            { diagnosis: "Cavity", treatment: "Filling", date: new Date("2023-11-10") }
        ],
        doctorId: 1
    },
    {
        fullName: "Sara Khan",
        email: "sara.khan@example.com",
        phone: "0321-7654321",
        age: 29,
        gender: "Female",
        bloodGroup: "A-",
        address: "Islamabad, Pakistan",
        dateOfBirth: new Date("1995-10-22"),
        medicalHistory: [
            { diagnosis: "Routine Checkup", treatment: "Cleaning", date: new Date("2024-01-15") }
        ],
        doctorId: 1
    },
    {
        fullName: "Hashir",
        email: "hashir@example.com",
        phone: "0310-1234569",
        age: 25,
        gender: "Male",
        bloodGroup: "O+",
        address: "Karachi, Pakistan",
        dateOfBirth: new Date("1999-03-25"),
        medicalHistory: [
            { diagnosis: "Braces", treatment: "Adjustment", date: new Date("2024-02-01") }
        ],
        doctorId: 2
    },
    {
        fullName: "Ayesha Bibi",
        email: "ayesha@example.com",
        phone: "0333-5556667",
        age: 42,
        gender: "Female",
        bloodGroup: "AB+",
        address: "Peshawar, Pakistan",
        dateOfBirth: new Date("1982-06-12"),
        medicalHistory: [],
        doctorId: 1
    },
    {
        fullName: "Zain Malik",
        email: "zain@example.com",
        phone: "0345-9998887",
        age: 12,
        gender: "Male",
        bloodGroup: "B-",
        address: "Quetta, Pakistan",
        dateOfBirth: new Date("2012-08-30"),
        medicalHistory: [
            { diagnosis: "Tooth Extraction", treatment: "Surgery", date: new Date("2023-05-20") }
        ],
        doctorId: 3
    },
    {
        fullName: "Fatima Noor",
        email: "fatima@example.com",
        phone: "0300-1112223",
        age: 27,
        gender: "Female",
        bloodGroup: "O-",
        address: "Multan, Pakistan",
        dateOfBirth: new Date("1997-01-20"),
        medicalHistory: [],
        doctorId: 2
    },
    {
        fullName: "Usman Ghani",
        email: "usman@example.com",
        phone: "0321-4445556",
        age: 55,
        gender: "Male",
        bloodGroup: "A+",
        address: "Sialkot, Pakistan",
        dateOfBirth: new Date("1969-12-05"),
        medicalHistory: [
            { diagnosis: "Gum Disease", treatment: "Scaling", date: new Date("2024-02-15") }
        ],
        doctorId: 1
    },
    {
        fullName: "Hina Jamil",
        email: "hina@example.com",
        phone: "0311-7776665",
        age: 31,
        gender: "Female",
        bloodGroup: "B+",
        address: "Faisalabad, Pakistan",
        dateOfBirth: new Date("1993-04-14"),
        medicalHistory: [],
        doctorId: 3
    },
    {
        fullName: "Bilal Farooq",
        email: "bilal@example.com",
        phone: "0344-3334445",
        age: 48,
        gender: "Male",
        bloodGroup: "O+",
        address: "Rawalpindi, Pakistan",
        dateOfBirth: new Date("1976-11-10"),
        medicalHistory: [
            { diagnosis: "Root Canal", treatment: "Endodontics", date: new Date("2023-09-05") }
        ],
        doctorId: 1
    },
    {
        fullName: "Marium Khan",
        email: "marium@example.com",
        phone: "0300-8887776",
        age: 22,
        gender: "Female",
        bloodGroup: "A-",
        address: "Gujranwala, Pakistan",
        dateOfBirth: new Date("2002-02-14"),
        medicalHistory: [],
        doctorId: 2
    }
];

async function seedDB() {
    try {
        console.log("🌱 Starting Seeding...");
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing patients
        await Patient.deleteMany({});

        // Insert new patients
        await Patient.insertMany(samplePatients);

        console.log("✅ SUCCESS: 10 sample patients added to MongoDB!");
    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

seedDB();