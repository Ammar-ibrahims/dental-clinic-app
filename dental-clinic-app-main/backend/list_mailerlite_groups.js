import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api';

async function listGroups() {
    console.log("🚀 Fetching MailerLite Groups...");
    console.log("API Key present:", !!process.env.MAILERLITE_API_KEY);
    
    try {
        const response = await axios.get(`${MAILERLITE_API_URL}/groups`, {
            headers: {
                'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log("\nFound Groups JSON:");
        console.log(JSON.stringify(response.data.data.map(g => ({
            id: g.id,
            name: g.name,
            subscribers: g.subscribers_count
        })), null, 2));
        
    } catch (err) {
        console.error("❌ Failed to fetch groups:", err.response?.data || err.message);
    }
}

listGroups();
