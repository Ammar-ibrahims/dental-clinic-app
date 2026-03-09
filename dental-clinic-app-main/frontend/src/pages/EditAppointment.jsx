import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditAppointment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [status, setStatus] = useState('');
    const [appointment, setAppointment] = useState(null);

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const res = await fetch(`/api/appointments/${id}`);
                if (!res.ok) throw new Error('Appointment not found');
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
        setError(''); setSuccess('');
        setSubmitting(true);
        try {
            const res = await fetch(`/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.errors?.join(', ') || data.error || 'Update failed');
            }
            setSuccess('✅ Appointment status updated!');
            setTimeout(() => navigate('/appointments'), 1200);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>;
    if (!appointment) return <p className="p-8 text-center text-red-500">Appointment not found.</p>;

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Edit Appointment</h1>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

                {/* Read-only appointment info */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p className="text-sm"><span className="font-semibold text-gray-700">Patient:</span> {appointment.patient_name}</p>
                    <p className="text-sm"><span className="font-semibold text-gray-700">Dentist:</span> {appointment.dentist_name}</p>
                    <p className="text-sm"><span className="font-semibold text-gray-700">Date:</span> {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString() : '—'}</p>
                    <p className="text-sm"><span className="font-semibold text-gray-700">Time:</span> {appointment.appointment_time || '—'}</p>
                    {appointment.treatment_type && (
                        <p className="text-sm"><span className="font-semibold text-gray-700">Treatment:</span> {appointment.treatment_type}</p>
                    )}
                    {appointment.notes && (
                        <p className="text-sm"><span className="font-semibold text-gray-700">Notes:</span> {appointment.notes}</p>
                    )}
                </div>

                {/* Editable status */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                    {submitting ? 'Updating...' : 'Update Status'}
                </button>
            </form>
        </div>
    );
}

export default EditAppointment;
