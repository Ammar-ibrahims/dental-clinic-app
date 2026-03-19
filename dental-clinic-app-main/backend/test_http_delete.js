import http from 'http';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'secret');
console.log("Token:", token);

const req = http.request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/appointments/31',
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
}, res => {
    let d = '';
    res.on('data', chunk => d+= chunk);
    res.on('end', () => console.log("Status:", res.statusCode, "Body:", d));
});
req.on('error', console.error);
req.end();
