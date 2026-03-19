import 'dotenv/config';
import * as AppointmentModel from './src/models/appointmentModel.js';

async function testGet() {
    try {
        const idToTest = 31; 
        console.log(`Getting appointment ${idToTest}...`);
        const res = await AppointmentModel.getAppointmentById(idToTest);
        console.log(`Success! Rows returned: ${res.rows.length}`);
        if (res.rows.length > 0) {
           console.log("Appointment details:", res.rows[0]);
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    } finally {
        process.exit(0);
    }
}
testGet();
