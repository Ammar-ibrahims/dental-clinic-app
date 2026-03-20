import * as mailerLiteService from './src/services/mailerLiteService.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function testEmail() {
    const testEmail = 'amazhar2005@gmail.com'; // Use a verified email if possible
    const testName = 'Test User';
    
    console.log("🚀 Starting MailerLite Test...");
    console.log("API Key present:", !!process.env.MAILERLITE_API_KEY);
    
    try {
        console.log("\n1. Testing Subscriber Addition...");
        await mailerLiteService.addSubscriberToGroup(testEmail, testName);
        
        console.log("\n2. Testing Transactional Email...");
        await mailerLiteService.sendAppointmentEmail(
            testEmail, 
            testName, 
            "Test Date at Test Time"
        );
        
        console.log("\n✅ Test completed successfully!");
    } catch (err) {
        console.error("\n❌ Test failed!");
        console.error(err.message);
        if (err.response) {
            console.error("Response Data:", JSON.stringify(err.response.data));
        }
    }
}

testEmail();
