import { useState, useEffect } from 'react';

function AdminAppointments() {
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

    const handleStatusChange = async (id, newStatus) => {
        try {
            // Fixed: Use absolute URL
            const res = await fetch(`${API_BASE_URL}/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update status');
            const data = await res.json();
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: data.status } : a));
        } catch (err) {
            alert('❌ ' + err.message);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin: All Appointments</h1>

            {loading && (
                <p className="text-gray-500 text-center py-8">Loading appointments...</p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                    ❌ {error}
                </div>
            )}

            {!loading && !error && appointments.length === 0 && (
                <p className="text-gray-400 text-center py-8">No appointments found.</p>
            )}

            {!loading && !error && appointments.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-600 text-sm">ID</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Patient</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Doctor</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Date & Time</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Timezone</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Treatment</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {appointments.map((appt) => {
                                const dateObj = new Date(appt.appointment_date);
                                const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                const formattedTime = appt.appointment_time ? appt.appointment_time.slice(0, 5) : '--:--';

                                return (
                                    <tr key={appt.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 text-gray-500 text-sm">#{appt.id}</td>
                                        <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                                            {appt.patient_name} <br />
                                            <span className="text-xs text-gray-500 font-normal">{appt.patient_phone}</span>
                                        </td>
                                        <td className="p-4 text-gray-700 whitespace-nowrap">
                                            Dr. {appt.dentist_name} <br />
                                            <span className="text-xs text-gray-500">{appt.specialty}</span>
                                        </td>
                                        <td className="p-4 text-gray-700 whitespace-nowrap">
                                            <div className="font-medium">{formattedDate}</div>
                                            <div className="text-blue-600 font-bold">{formattedTime}</div>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">{appt.timezone || 'Asia/Karachi'}</td>
                                        <td className="p-4 text-gray-700 text-sm max-w-[150px] truncate" title={appt.treatment_type}>
                                            {appt.treatment_type || '-'}
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={appt.status}
                                                onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                                                className={`text-sm font-bold p-1 rounded border outline-none
                                                    ${appt.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                                    ${appt.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                                                    ${appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : ''}
                                                    ${appt.status === 'Confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                                `}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleDelete(appt.id)}
                                                className="text-red-500 hover:text-red-700 font-semibold text-sm transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminAppointments;