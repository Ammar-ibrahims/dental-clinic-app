import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DoctorCard from '../components/DoctorCard';

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDoctors = async () => {
        try {
            const res = await fetch('/api/dentists');
            if (!res.ok) throw new Error('Failed to load doctors');
            const data = await res.json();
            setDoctors(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this doctor?')) return;
        try {
            const res = await fetch(`/api/dentists/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete doctor');
            setDoctors((prev) => prev.filter((d) => d.id !== id));
        } catch (err) {
            alert('❌ ' + err.message);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Our Doctors</h1>
                <Link
                    to="/doctors/new"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    + Add Doctor
                </Link>
            </div>

            {loading && (
                <p className="text-gray-500 text-center py-8">Loading doctors...</p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    ❌ {error}
                </div>
            )}

            {!loading && !error && doctors.length === 0 && (
                <p className="text-gray-400 text-center py-8">No doctors found.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {doctors.map((doc) => (
                    <DoctorCard key={doc.id} doctor={doc} onDelete={handleDelete} />
                ))}
            </div>
        </div>
    );
}

export default Doctors;