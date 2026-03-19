import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api/transactional';

export const sendAppointmentEmail = async (toEmail, patientName, appointmentDate) => {
    try {
        const fromEmail = process.env.MAILERLITE_FROM_EMAIL || 'amazhar2005@gmail.com';

        const response = await axios.post(
            `${MAILERLITE_API_URL}/emails/default`, // Using 'default' transactional route
            {
                subject: 'Appointment Scheduled - Dental Clinic',
                from: {
                    email: fromEmail,
                    name: 'Dental Clinic'
                },
                to: {
                    email: toEmail,
                    name: patientName
                },
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
        console.error('❌ MailerLite Error:', error.response ? JSON.stringify(error.response.data) : error.message);
        throw error;
    }
};