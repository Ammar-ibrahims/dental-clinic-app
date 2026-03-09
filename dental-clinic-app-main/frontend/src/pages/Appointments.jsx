import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppointmentCard from '../components/AppointmentCard';

function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- TASK 6 FIX: Get the Backend URL from Environment Variables ---
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                // Fixed: Use absolute URL
                const res = await fetch(`${API_BASE_URL}/api/appointments`);
                if (!res.ok) throw new Error('Failed to load appointments');
                const data = await res.json();
                setAppointments(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [API_BASE_URL]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) return;
        try {
            // Fixed: Use absolute URL
            const res = await fetch(`${API_BASE_URL}/api/appointments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete appointment');
            setAppointments((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            alert('❌ ' + err.message);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Appointments List</h1>
                <Link
                    to="/appointments/new"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    + Book New Appointment
                </Link>
            </div>

            {loading && (
                <p className="text-gray-500 text-center py-8">Loading appointments...</p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    ❌ {error}
                </div>
            )}

            {!loading && !error && appointments.length === 0 && (
                <p className="text-gray-400 text-center py-8">No appointments found.</p>
            )}

            <div className="space-y-4">
                {appointments.map((appt) => (
                    <AppointmentCard key={appt.id} appointment={appt} onDelete={handleDelete} />
                ))}
            </div>
        </div>
    );
}

export default Appointments;