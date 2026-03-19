import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SkeletonTable = () => (
    <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 shadow-sm"></div>
        ))}
    </div>
);

function AdminAppointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load appointments');
            const data = await res.json();
            // Sort by date upcoming first
            setAppointments(data.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/appointments/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Update failed');

            // Local update for snappy feel
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        } catch (err) {
            alert('❌ ' + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete the appointment.")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Delete failed');

            setAppointments(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            alert('❌ ' + err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Appointments</h1>
                    <p className="text-gray-500 font-medium">Manage and track all clinic schedules.</p>
                </div>
                {/* Optional: Add Filter Buttons here */}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span className="font-bold">{error}</span>
                </div>
            )}

            {loading ? (
                <SkeletonTable />
            ) : appointments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="text-5xl mb-4">📅</div>
                    <p className="text-gray-400 font-bold text-lg">No appointments found in the system.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {/* PC Header - Hidden on Mobile */}
                    <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-400">
                        <div className="col-span-1">Date & Time</div>
                        <div className="col-span-1">Patient</div>
                        <div className="col-span-1">Doctor</div>
                        <div className="col-span-1">Treatment</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {appointments.map(appt => (
                        <div key={appt.id}
                            className={`bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100 group ${updatingId === appt.id ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">

                                {/* Date & Time */}
                                <div className="flex items-center gap-4 col-span-1">
                                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-600 shrink-0">
                                        <span className="text-[10px] font-black uppercase leading-none">{new Date(appt.appointment_date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg font-black">{new Date(appt.appointment_date).getDate()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-gray-800 text-sm">{appt.appointment_time?.slice(0, 5)}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(appt.appointment_date).getFullYear()}</span>
                                    </div>
                                </div>

                                {/* Patient */}
                                <div className="col-span-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase lg:hidden mb-1">Patient</p>
                                    <p className="font-black text-gray-800 group-hover:text-blue-600 transition">{appt.patient_name || appt.name || 'Anonymous'}</p>
                                </div>

                                {/* Doctor */}
                                <div className="col-span-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase lg:hidden mb-1">Doctor</p>
                                    <p className="font-bold text-gray-600 text-sm">Dr. {appt.dentist_name || 'Unassigned'}</p>
                                </div>

                                {/* Treatment */}
                                <div className="col-span-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase lg:hidden mb-1">Treatment</p>
                                    <p className="text-sm font-bold text-gray-500 truncate">{appt.treatment_type || 'General Checkup'}</p>
                                </div>

                                {/* Status */}
                                <div className="col-span-1 flex flex-col items-center lg:items-center">
                                    <p className="text-xs text-gray-400 font-bold uppercase lg:hidden mb-2">Status</p>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(appt.status)}`}>
                                        {appt.status}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex flex-wrap justify-end gap-2 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                                    {appt.status === 'Pending' && (
                                        <button onClick={() => handleStatusUpdate(appt.id, 'Confirmed')}
                                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-green-600 transition shadow-sm">
                                            Confirm
                                        </button>
                                    )}
                                    {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                                        <button onClick={() => handleStatusUpdate(appt.id, 'Completed')}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition shadow-sm">
                                            Done
                                        </button>
                                    )}
                                    <Link to={`/admin/appointments/edit/${appt.id}`}
                                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-gray-200 transition">
                                        Edit
                                    </Link>
                                    <button onClick={() => handleDelete(appt.id)}
                                        className="bg-white text-red-500 border border-red-100 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-50 transition">
                                        Delete
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminAppointments;