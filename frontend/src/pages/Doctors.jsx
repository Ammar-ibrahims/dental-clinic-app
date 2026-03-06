import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- TASK 6 FIX ---
    const API_BASE_URL = 'https://dental-clinic-app-production-13ce.up.railway.app';

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/dentists`);
                if (!res.ok) throw new Error('Failed to load doctors');
                const data = await res.json();
                setDoctors(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, [API_BASE_URL]);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Doctors</h1>
                <Link to="/doctors/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                    + Add Doctor
                </Link>
            </div>
            {/* ... rest of your UI code ... */}
        </div>
    );
}

export default Doctors;