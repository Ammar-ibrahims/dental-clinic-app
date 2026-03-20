import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.MAILERLITE_API_KEY;
const BASE_URL = 'https://connect.mailerlite.com/api';

async function testTransactional() {
    console.log('--- Testing MailerLite Transactional Endpoints ---');
    
    // Trial 1: Standard Connect API transactional endpoint
    try {
        console.log('\nTrial 1: POST /emails/transactional');
        const res = await axios.post(`${BASE_URL}/emails/transactional`, {
            subject: "Test Transactional",
            from: "amazhar2005@gmail.com",
            to: "ammaribrahims.195@gmail.com",
            content: "Hello World"
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Success Trial 1:', res.status);
    } catch (err) {
        console.log('Fail Trial 1:', err.response?.status, err.response?.data?.message || err.message);
    }

    // Trial 2: /api/v2/emails/transactional
    try {
        console.log('\nTrial 2: POST /v2/emails/transactional');
        const res = await axios.post(`${BASE_URL}/v2/emails/transactional`, {
            subject: "Test Transactional",
            from: "amazhar2005@gmail.com",
            to: "ammaribrahims.195@gmail.com",
            content: "Hello World"
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Success Trial 2:', res.status);
    } catch (err) {
        console.log('Fail Trial 2:', err.response?.status, err.response?.data?.message || err.message);
    }

    // Trial 3: Check if it's a GET to list available transactional emails
    try {
        console.log('\nTrial 3: GET /emails/transactional');
        const res = await axios.get(`${BASE_URL}/emails/transactional`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        console.log('Success Trial 3:', res.status, 'Results:', res.data.data.length);
    } catch (err) {
        console.log('Fail Trial 3:', err.response?.status, err.response?.data?.message || err.message);
    }
}

testTransactional();
