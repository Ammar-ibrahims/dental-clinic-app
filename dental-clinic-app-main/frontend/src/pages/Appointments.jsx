import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppointmentCard from '../components/AppointmentCard';

// --- Task 5: Skeleton Loader for Appointments ---
const SkeletonCard = () => (
    <div className="animate-pulse bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
        <div className="space-y-2 w-1/2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
    </div>
);

function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/appointments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                const data = await res.json();
                setAppointments(data);
            } catch (err) {
                console.error("Fetch Error:", err);
                setError("Could not load appointments. Please ensure the backend is running.");
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this appointment?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete');
            setAppointments((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            alert('❌ ' + err.message);
        }
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-4xl mx-auto">

            {/* Responsive Header: Stacks vertically on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Appointments List</h1>
                <Link
                    to="/appointments/new"
                    className="w-full sm:w-auto text-center bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition focus:ring-4 focus:ring-blue-300 outline-none"
                    aria-label="Book a new appointment"
                >
                    + Book New Appointment
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6" role="alert">
                    ❌ {error}
                </div>
            )}

            {/* --- Task 5: Show Skeletons while loading --- */}
            <div className="space-y-3">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl">
                        <p className="text-gray-400">No appointments found for this clinic.</p>
                    </div>
                ) : (
                    appointments.map((appt) => (
                        <AppointmentCard
                            key={appt.id}
                            appointment={appt}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default Appointments;