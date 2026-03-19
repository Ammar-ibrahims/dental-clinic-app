import { useState, useEffect } from 'react';

// --- Task 5: Skeleton Loader for Dashboard Cards ---
const SkeletonCard = () => (
    <div className="animate-pulse bg-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-300 rounded w-1/4"></div>
    </div>
);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error(`Failed to load stats (Status: ${res.status})`);
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
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

    const colorStyles = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', val: 'text-blue-600' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-800', val: 'text-purple-600' },
        green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800', val: 'text-green-600' },
        orange: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-800', val: 'text-orange-600' },
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">Clinic Dashboard</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6" role="alert">
                    ❌ {error}
                </div>
            )}

            {/* Responsive Grid: 1 col (mobile) -> 2 col (tablet) -> 4 col (desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {loading ? (
                    // --- Task 5: Show 4 Skeleton Cards while loading ---
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    cards.map(({ label, value, color }) => {
                        const style = colorStyles[color];
                        return (
                            <article
                                key={label}
                                className={`${style.bg} p-6 rounded-2xl border ${style.border} shadow-sm transition-transform hover:scale-[1.02]`}
                            >
                                <h2 className={`${style.text} font-bold text-sm sm:text-base uppercase tracking-wide`}>
                                    {label}
                                </h2>
                                <p className={`text-4xl sm:text-5xl font-black ${style.val} mt-2`}>
                                    {value ?? 0}
                                </p>
                            </article>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default Dashboard;