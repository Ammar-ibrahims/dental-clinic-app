import axios from 'axios';

const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Adds a patient to a MailerLite group for marketing automations.
 */
export const addSubscriberToGroup = async (email, name) => {
    try {
        const groupId = "182358610547836642";
        const apiKey = process.env.MAILERLITE_API_KEY;

        console.log(`📡 MailerLite Sync: Starting for ${email}...`);

        // 1. Create or Update Subscriber and get their ID
        const subRes = await axios.post(
            `${MAILERLITE_API_URL}/subscribers`,
            {
                email: email,
                fields: { 
                    name: name,
                    city: 'Dental-App-Sync-' + Date.now() // Force a field update change
                },
                status: 'active'
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        const subscriberId = subRes.data.data.id;
        console.log(`📡 MailerLite: Found Subscriber ID ${subscriberId}`);

        // 2. Remove from Group first (to reset automation trigger)
        console.log(`📡 MailerLite: Resetting group trigger for ${email}...`);
        try {
            await axios.delete(
                `${MAILERLITE_API_URL}/subscribers/${subscriberId}/groups/${groupId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            // Wait 10 seconds for MailerLite to process the deletion
            console.log("⏳ Waiting 10s for MailerLite processing...");
            await delay(10000);

        } catch (err) {
            // Ignore if not in group
        }

        // 3. Re-add to Group
        console.log(`📡 MailerLite: Final Assigning ${email} to group ${groupId}...`);
        await axios.post(
            `${MAILERLITE_API_URL}/subscribers/${subscriberId}/groups/${groupId}`,
            {}, 
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        console.log(`✅ MailerLite: Complete for ${email}`);
    } catch (error) {
        console.error('❌ MailerLite Sync Error:', {
            message: error.message,
            responseData: error.response?.data,
            status: error.response?.status
        });
    }
};


/**
 * Sends a transactional appointment confirmation email.
 * CRITICAL: This is required by appointmentSyncService.js.
 * Removing this will CRASH the backend.
 */
export const sendAppointmentEmail = async (toEmail, patientName, appointmentDate) => {
    try {
        const fromEmail = process.env.MAILERLITE_FROM_EMAIL || 'amazhar2005@gmail.com';

        const response = await axios.post(
            `${TRANSACTIONAL_API_URL}/emails/default`,
            {
                subject: 'Appointment Scheduled - Dental Clinic',
                from: { email: fromEmail, name: 'Dental Clinic' },
                to: { email: toEmail, name: patientName },
                content: {
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h1 style="color: #2563eb;">Appointment Confirmation</h1>
                            <p>Hello <strong>${patientName}</strong>,</p>
                            <p>Your dental appointment has been successfully scheduled.</p>
                            <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                                📅 <strong>Date:</strong> ${appointmentDate}
                            </p>
                            <p>Thank you for choosing our clinic!</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 0.8em; color: #888;">This is an automated notification. Please do not reply directly to this email.</p>
                        </div>
                    `
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        console.log('✅ Transactional email sent via MailerLite:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ MailerLite Transactional Error:', error.response ? JSON.stringify(error.response.data) : error.message);
        throw error;
    }
};