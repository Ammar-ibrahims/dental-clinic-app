import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.MAILERLITE_API_KEY;
const BASE_URL = 'https://connect.mailerlite.com/api';

async function listFields() {
    try {
        const res = await axios.get(`${BASE_URL}/fields`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        console.log('--- MailerLite Fields ---');
        res.data.data.forEach(field => {
            console.log(`- ${field.name} (${field.key})`);
        });
    } catch (err) {
        console.error('Error listing fields:', err.response?.data || err.message);
    }
}

listFields();
