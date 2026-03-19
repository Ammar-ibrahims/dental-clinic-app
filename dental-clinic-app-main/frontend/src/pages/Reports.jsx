import { useState, useEffect } from 'react';

const Card = ({ title, children, className = "" }) => (
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${className}`}>
        {title && <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>}
        {children}
    </div>
);

const Badge = ({ status }) => {
    const styles = {
        Pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
        Confirmed: "bg-blue-50 text-blue-700 border-blue-100",
        Completed: "bg-green-50 text-green-700 border-green-100",
        Cancelled: "bg-red-50 text-red-700 border-red-100",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
            {status}
        </span>
    );
};

function Reports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/reports`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch report data');
                const reportData = await res.json();
                setData(reportData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [API_BASE_URL]);

    if (loading) return <div className="p-8 text-gray-500 animate-pulse text-center">Crunching numbers...</div>;
    if (error) return <div className="p-8 text-red-500 text-center">❌ {error}</div>;

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Clinic Reports</h1>
                    <p className="text-gray-500">Real-time insights into your dental practice performance.</p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                    <span className="text-indigo-600 font-bold text-lg">{data.newPatientsLast30Days}</span>
                    <span className="text-indigo-800 text-sm ml-2 font-medium">New patients this month</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Status Breakdown */}
                <Card title="Appointment Status" className="lg:col-span-1">
                    <div className="space-y-4">
                        {data.statusBreakdown.map((item) => (
                            <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="font-semibold text-gray-700">{item.status}</span>
                                <span className="bg-white px-3 py-1 rounded-lg border border-gray-200 font-bold text-gray-900">
                                    {item.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Column 2: Treatment Trends */}
                <Card title="Top Treatments" className="lg:col-span-1">
                    <div className="space-y-6">
                        {data.treatmentTrends.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{item.treatment}</span>
                                    <span className="text-gray-500 font-bold">{item.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-indigo-500 h-2 rounded-full"
                                        style={{ width: `${(item.count / data.treatmentTrends[0].count) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Column 3: Today's Summary */}
                <Card title="Live Clinic Activity" className="lg:col-span-1">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.todaySummary.length > 0 ? (
                            data.todaySummary.map((appt) => (
                                <div key={appt.id} className="border-b border-gray-50 pb-4 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-gray-800 leading-tight">{appt.patient_name}</p>
                                        <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">{appt.appointment_time.slice(0, 5)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <p className="text-gray-500">Dr. {appt.doctor_name.split(' ')[0]}</p>
                                        <Badge status={appt.status} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase italic">{appt.treatment_type}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic text-center py-8">No appointments scheduled for today.</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Reports;
