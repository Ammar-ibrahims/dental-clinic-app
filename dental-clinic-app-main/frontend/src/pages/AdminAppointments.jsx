import { useState, useEffect } from 'react';

function AdminAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = 'http://16.170.201.132:8000/api';

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/appointments`);
            if (!res.ok) throw new Error(`Server error (Status: ${res.status})`);
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Failed to load appointments. Ensure the backend is online.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('PERMANENTLY delete this appointment record?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/appointments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete appointment');
            setAppointments((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
            alert('❌ ' + err.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
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
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">

            {/* Responsive Header: Stacks on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">
                    Admin: Master Appointments
                </h1>
                <button
                    onClick={fetchAppointments}
                    className="w-full sm:w-auto bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition"
                >
                    🔄 Refresh List
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-bold">Loading master records...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-4 shadow-sm" role="alert">
                    <p className="font-bold mb-1">Database Connection Error</p>
                    <p className="text-sm opacity-90">{error}</p>
                    <button onClick={fetchAppointments} className="mt-4 text-xs bg-red-100 px-3 py-1 rounded-md font-bold underline">Retry Connection</button>
                </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
                    <p className="text-gray-400 text-lg">No appointments exist in the system yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                    {/* --- RESPONSIVE TABLE WRAPPER --- */}
                    {/* This allows horizontal scrolling on small screens */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th scope="col" className="p-4 font-black text-gray-500 text-xs uppercase tracking-widest">ID</th>
                                    <th scope="col" className="p-4 font-black text-gray-700 text-sm">Patient Details</th>
                                    <th scope="col" className="p-4 font-black text-gray-700 text-sm">Doctor</th>
                                    <th scope="col" className="p-4 font-black text-gray-700 text-sm">Schedule</th>
                                    <th scope="col" className="p-4 font-black text-gray-700 text-sm">Status</th>
                                    <th scope="col" className="p-4 font-black text-gray-700 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appointments.map((appt) => {
                                    const dateObj = new Date(appt.appointment_date);
                                    const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                                    const formattedTime = appt.appointment_time ? appt.appointment_time.slice(0, 5) : '--:--';

                                    return (
                                        <tr key={appt.id} className="hover:bg-blue-50/30 transition">
                                            <td className="p-4 text-gray-400 text-xs font-mono">#{appt.id}</td>
                                            <td className="p-4">
                                                <div className="font-black text-gray-900">{appt.patient_name || appt.name}</div>
                                                <div className="text-xs text-gray-500 font-medium">{appt.phone || 'N/A'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-blue-700">Dr. {appt.dentist_name || 'Unassigned'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800 text-sm">{formattedDate}</div>
                                                <div className="text-blue-600 font-black">{formattedTime}</div>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    aria-label="Change appointment status"
                                                    value={appt.status}
                                                    onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                                                    className={`text-[10px] font-black p-2 rounded-xl border-2 outline-none transition
                                                        ${appt.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                        ${appt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                        ${appt.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                                        ${appt.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                    `}
                                                >
                                                    <option value="Pending">🕒 PENDING</option>
                                                    <option value="Confirmed">✅ CONFIRMED</option>
                                                    <option value="Completed">🏁 COMPLETED</option>
                                                    <option value="Cancelled">❌ CANCELLED</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(appt.id)}
                                                    aria-label={`Delete appointment for ${appt.patient_name}`}
                                                    className="bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg font-bold text-[10px] transition shadow-sm"
                                                >
                                                    DELETE
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminAppointments;