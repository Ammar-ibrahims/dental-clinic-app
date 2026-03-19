import 'dotenv/config';
import { remove } from './src/controllers/appointmentController.js';

async function testRemove() {
    const req = {
        params: { id: '32' },
        user: { role: 'admin' } // Just in case it's used
    };

    const res = {
        statusCode: 200,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log(`Response [${this.statusCode}]:`, JSON.stringify(data, null, 2));
        }
    };

    console.log("Calling remove(32)...");
    await remove(req, res);
    console.log("Finished remove()");
}

testRemove().catch(console.error).finally(() => process.exit(0));
