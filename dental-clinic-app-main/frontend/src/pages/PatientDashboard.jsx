import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PatientDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ upcoming: null, total: 0, timeRemaining: '' });
    const [loading, setLoading] = useState(true);
    const userName = localStorage.getItem('userName') || 'Patient';
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    // Helper: Format remaining time
    const getTimeRemaining = (targetDate) => {
        const total = Date.parse(targetDate) - Date.parse(new Date());
        if (total <= 0) return 'Just now';

        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        let response = '';
        if (days > 0) response += `${days}d `;
        if (hours > 0) response += `${hours}h `;
        if (minutes > 0) response += `${minutes}m `;
        return response.trim() || 'less than 1m';
    };

    // Helper: Human readable date
    const formatReadableDate = (dateStr, timeStr) => {
        const date = new Date(`${dateStr}T${timeStr}`);
        return date.toLocaleDateString('default', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        let interval;
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/appointments/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Failed to fetch appointments');

                const appointments = await res.json();

                // 1. Calculate stats
                const activeAppointments = appointments.filter(a => a.status !== 'Cancelled');

                // 2. Find closest future appointment (including today)
                const now = new Date();

                const upcomingAppt = appointments
                    .filter(a => a.status !== 'Cancelled')
                    .map(a => {
                        const d = new Date(a.appointment_date);
                        // Local getters match the browser/user local intent for the date
                        const year = d.getFullYear();
                        const month = d.getMonth();
                        const day = d.getDate();

                        const [hour, min, sec] = a.appointment_time.split(':').map(Number);

                        // Reconstruct in local time for comparison with 'now'
                        const fullDateTime = new Date(year, month, day, hour, min, sec || 0);
                        return { ...a, fullDateTime };
                    })
                    .filter(a => a.fullDateTime > now)
                    .sort((a, b) => a.fullDateTime - b.fullDateTime)[0];

                if (upcomingAppt) {
                    setStats({
                        upcoming: upcomingAppt,
                        total: activeAppointments.length,
                        timeRemaining: getTimeRemaining(upcomingAppt.fullDateTime)
                    });

                    // Start timer to update countdown every minute
                    interval = setInterval(() => {
                        setStats(prev => ({
                            ...prev,
                            timeRemaining: getTimeRemaining(upcomingAppt.fullDateTime)
                        }));
                    }, 60000);
                } else {
                    setStats({ upcoming: null, total: activeAppointments.length, timeRemaining: '' });
                }
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
        return () => clearInterval(interval);
    }, [API_BASE_URL]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                    Good Morning, <span className="text-blue-600">{userName}</span>!
                </h1>
                <p className="text-slate-500 font-medium mt-2">Here is what's happening with your dental health.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 flex flex-col justify-between min-h-[240px]">
                    <div>
                        <h2 className="text-lg font-bold opacity-80 mb-1">Upcoming appointment</h2>
                        <div className="flex flex-col gap-1">
                            {loading ? (
                                <p className="text-3xl font-black">...</p>
                            ) : stats.upcoming ? (
                                <>
                                    <p className="text-2xl md:text-3xl font-black">
                                        {formatReadableDate(new Date(stats.upcoming.appointment_date).toISOString().split('T')[0], stats.upcoming.appointment_time)}
                                    </p>
                                    <p className="text-sm font-bold bg-white/10 self-start px-3 py-1 rounded-full mt-2">
                                        ⏳ time left: <span className="text-yellow-300">{stats.timeRemaining}</span>
                                    </p>
                                </>
                            ) : (
                                <p className="text-3xl font-black text-blue-100/50">No upcoming appointments</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        {stats.upcoming ? (
                            <>
                                <button
                                    onClick={() => navigate('/patient/appointments')}
                                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-50 transition"
                                >
                                    Reschedule
                                </button>
                                <button
                                    onClick={() => navigate('/patient/appointments')}
                                    className="bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-400 transition border border-white/20"
                                >
                                    Details
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/patient/appointments')}
                                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-black text-sm hover:bg-blue-50 transition shadow-lg"
                            >
                                Book Appointment now
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-center text-center">
                    <span className="text-4xl mb-4">🦷</span>
                    <h2 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Total Treatments</h2>
                    <p className="text-5xl font-black text-slate-800">{loading ? '...' : stats.total}</p>
                    <p className="text-slate-400 text-sm mt-2">records stored safely</p>
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-black text-slate-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { label: 'Book Visit', icon: '📅', color: 'bg-green-50 text-green-600', path: '/patient/appointments' },
                        { label: 'My Doctors', icon: '🩺', color: 'bg-purple-50 text-purple-600', path: '/patient/doctors' },
                        { label: 'Profile', icon: '🧑', color: 'bg-orange-50 text-orange-600', path: '/patient/profile' },
                    ].map(card => (
                        <button
                            key={card.label}
                            onClick={() => navigate(card.path)}
                            className={`${card.color} p-8 rounded-3xl flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform border border-transparent hover:border-current/20 w-full shadow-sm`}
                        >
                            <span className="text-4xl">{card.icon}</span>
                            <span className="font-extrabold text-base">{card.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PatientDashboard;
