import { useState, useEffect } from 'react';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- TASK 6 FIX: Get the Backend URL from Railway environment variables ---
    // If VITE_API_URL is not set, it defaults to empty string (useful for local proxy)
    const API_BASE_URL = 'https://dental-clinic-app-production-13ce.up.railway.app';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // FIXED: Use the absolute URL with the variable
                const res = await fetch(`${API_BASE_URL}/api/stats`);

                if (!res.ok) {
                    const text = await res.text();
                    console.error("Server returned non-ok status:", res.status, text);
                    throw new Error(`Failed to load stats (Status: ${res.status})`);
                }

                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Fetch Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [API_BASE_URL]);

    const cards = stats
        ? [
            { label: 'Total Patients', value: stats.total_patients, color: 'blue' },
            { label: 'Total Dentists', value: stats.total_dentists, color: 'purple' },
            { label: "Today's Appointments", value: stats.todays_appointments, color: 'green' },
            { label: 'Total Appointments', value: stats.total_appointments, color: 'orange' },
        ]
        : [];

    const colorMap = {
        blue: 'bg-blue-50 border-blue-100 text-blue-800 text-blue-600',
        purple: 'bg-purple-50 border-purple-100 text-purple-800 text-purple-600',
        green: 'bg-green-50 border-green-100 text-green-800 text-green-600',
        orange: 'bg-orange-50 border-orange-100 text-orange-800 text-orange-600',
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Clinic Dashboard</h1>

            {loading && (
                <p className="text-gray-500 text-center py-8">Loading stats...</p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    ❌ {error}
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map(({ label, value, color }) => {
                        const colors = colorMap[color].split(' ');
                        const bg = colors[0];
                        const border = colors[1];
                        const labelColor = colors[2];
                        const valueColor = colors[3];

                        return (
                            <div
                                key={label}
                                className={`${bg} p-6 rounded-2xl border ${border}`}
                            >
                                <h2 className={`${labelColor} font-bold text-lg`}>{label}</h2>
                                <p className={`text-5xl font-black ${valueColor} mt-2`}>
                                    {value ?? '—'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Dashboard;