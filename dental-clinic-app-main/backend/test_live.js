import http from 'http';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Generate a valid admin token using JWT_SECRET
const token = jwt.sign({ id: 1, email: 'admin@clinic.com', role: 'admin' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

const req = http.request({
    hostname: '16.170.201.132.nip.io',
    port: 80, // Since it's HTTP
    path: '/api/appointments/32',
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
}, res => {
    let d = '';
    res.on('data', chunk => d+= chunk);
    res.on('end', () => console.log("LIVE Status:", res.statusCode, "Body:", d));
});
req.on('error', console.error);
req.end();
