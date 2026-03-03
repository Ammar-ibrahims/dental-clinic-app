import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PatientCard from '../components/PatientCard';

function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPatients = async () => {
        try {
            const res = await fetch('/api/patients');
            if (!res.ok) throw new Error('Failed to load patients');
            const data = await res.json();
            setPatients(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this patient?')) return;
        try {
            const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete patient');
            setPatients((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            alert('❌ ' + err.message);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
                <Link
                    to="/patients/new"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    + Add Patient
                </Link>
            </div>

            {loading && (
                <p className="text-gray-500 text-center py-8">Loading patients...</p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    ❌ {error}
                </div>
            )}

            {!loading && !error && patients.length === 0 && (
                <p className="text-gray-400 text-center py-8">No patients found. Add your first patient!</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patients.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} onDelete={handleDelete} />
                ))}
            </div>
        </div>
    );
}

export default Patients;
