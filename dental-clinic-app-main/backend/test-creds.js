import 'dotenv/config';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:8000/api/auth/google/callback'
);

async function testCredentials() {
    try {
        console.log("Testing credentials...");
        console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
        // We can't really "test" them without a real exchange, 
        // but we can see if trying to get a token returns `invalid_client` specifically.

        // This will fail because the code is garbage, but the error will tell us something.
        const { tokens } = await oauth2Client.getToken('some_garbage_code');
    } catch (err) {
        console.log("Error Response:", err.response?.data || err.message);
    }
}

testCredentials();
