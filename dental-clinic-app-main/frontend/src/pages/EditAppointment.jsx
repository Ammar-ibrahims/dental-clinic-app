import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- Task 5: Skeleton Loader for the Edit Form ---
const SkeletonEdit = () => (
    <div className="animate-pulse space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
        <div className="h-32 bg-blue-50/50 rounded-2xl w-full"></div>
        <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
        </div>
        <div className="flex gap-4">
            <div className="h-12 bg-gray-100 rounded-xl flex-1"></div>
            <div className="h-12 bg-gray-200 rounded-xl flex-1"></div>
        </div>
    </div>
);

function EditAppointment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [status, setStatus] = useState('');
    const [appointment, setAppointment] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Appointment not found');
                    throw new Error('Server error: ' + res.status);
                }
                const data = await res.json();
                setAppointment(data);
                setStatus(data.status || 'Pending');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointment();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('Update failed');

            setSuccess('✅ Appointment status updated successfully!');
            setTimeout(() => navigate('/admin/appointments'), 1500);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-6 sm:mb-8 text-center">Manage Appointment</h1>

            {loading ? (
                <SkeletonEdit />
            ) : !appointment ? (
                <div className="p-8 text-center bg-white rounded-2xl shadow-sm border">
                    <p className="text-red-500 font-bold mb-4">{error || "Appointment not found."}</p>
                    <button onClick={() => navigate('/admin/appointments')} className="text-blue-600 font-bold underline">Back to list</button>
                </div>
            ) : (
                /* Responsive Form Padding: p-4 on mobile, p-8 on desktop */
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 sm:p-8 rounded-2xl shadow-lg border border-gray-100">

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm" role="alert">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-sm" role="status">{success}</div>}

                    {/* Appointment Info Summary - Responsive Layout */}
                    <div className="bg-blue-50 p-5 sm:p-6 rounded-2xl border border-blue-100 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between gap-1">
                            <span className="text-blue-800 font-bold text-xs uppercase tracking-wider">Patient</span>
                            <span className="text-blue-900 font-black">{appointment.patient_name || appointment.name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between border-t border-blue-100 pt-3 gap-1">
                            <span className="text-blue-800 font-bold text-xs uppercase tracking-wider">Doctor</span>
                            <span className="text-blue-900 font-black">Dr. {appointment.dentist_name || 'Unassigned'}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between border-t border-blue-100 pt-3 gap-1">
                            <span className="text-blue-800 font-bold text-xs uppercase tracking-wider">Scheduled Time</span>
                            <span className="text-blue-900 font-black">
                                {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time?.slice(0, 5)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="status-select" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Update Status</label>
                        <select
                            id="status-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition outline-none"
                        >
                            <option value="Pending">🕒 Pending Review</option>
                            <option value="Confirmed">✅ Confirmed</option>
                            <option value="Completed">🏁 Completed</option>
                            <option value="Cancelled">❌ Cancelled</option>
                        </select>
                    </div>

                    {/* Responsive Buttons: Stacked on mobile, side-by-side on desktop */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/appointments')}
                            className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:flex-1 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 disabled:bg-blue-300 shadow-md transition focus:ring-4 focus:ring-blue-200"
                        >
                            {submitting ? 'UPDATING...' : 'SAVE CHANGES'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default EditAppointment;