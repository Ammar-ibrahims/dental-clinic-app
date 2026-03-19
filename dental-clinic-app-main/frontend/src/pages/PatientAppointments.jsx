import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function PatientAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchMyAppointments = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/appointments/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load appointments');
                const data = await res.json();
                setAppointments(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMyAppointments();
    }, [API_BASE_URL]);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">My Appointments</h1>
                <Link to="/patient/appointments/new" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
                    + Book New
                </Link>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">⚠️ {error}</div>}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-24 rounded-2xl animate-pulse border"></div>
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed">
                    <p className="text-gray-400 font-medium">No appointments found. Start by booking one!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {appointments.map(appt => (
                        <div key={appt.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-600">
                                    <span className="text-xs font-black uppercase">{new Date(appt.appointment_date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-xl font-black leading-none">{new Date(appt.appointment_date).getDate()}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Dr. {appt.dentist_name}</h3>
                                    <p className="text-sm text-gray-500">{appt.appointment_time} • {appt.treatment_type || 'Dental Checkup'}</p>
                                    <Link
                                        to={`/patient/appointments/edit/${appt.id}`}
                                        className="text-xs text-blue-600 hover:underline font-bold mt-1 inline-block"
                                    >
                                        Edit Details
                                    </Link>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${appt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                    appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {appt.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PatientAppointments;
