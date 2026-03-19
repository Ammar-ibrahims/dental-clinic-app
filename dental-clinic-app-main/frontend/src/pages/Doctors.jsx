import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- Task 5: Skeleton Loader for Doctor Cards ---
const SkeletonCard = () => (
    <div className="animate-pulse bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
        </div>
        <div className="space-y-3">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
    </div>
);

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/doctors`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error(`Failed to load doctors (Status: ${res.status})`);
                const data = await res.json();
                setDoctors(data);
            } catch (err) {
                console.error("Fetch Doctors Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, [API_BASE_URL]);

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">

            {/* Responsive Header: Stacks on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Doctors</h1>
                {localStorage.getItem('role') === 'admin' && (
                    <Link
                        to="/admin/doctors/new"
                        className="w-full sm:w-auto text-center bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md focus:ring-4 focus:ring-blue-300 outline-none"
                        aria-label="Add a new doctor"
                    >
                        + Add Doctor
                    </Link>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6" role="alert">
                    ❌ {error}
                </div>
            )}

            {/* Responsive Grid: 1 col (mobile) -> 2 col (tablet) -> 3 col (desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" aria-busy={loading}>
                {loading ? (
                    // --- Task 5: Show 6 Skeleton Cards while loading ---
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : doctors.length === 0 && !error ? (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl">
                        <p className="text-gray-500">No doctors found in the system.</p>
                        {localStorage.getItem('role') === 'admin' && (
                            <Link to="/admin/doctors/new" className="text-blue-600 font-bold hover:underline mt-2 inline-block">
                                Add your first doctor now
                            </Link>
                        )}
                    </div>
                ) : (
                    doctors.map((doc) => (
                        <article key={doc.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl" aria-hidden="true">
                                    {doc.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{doc.name}</h2>
                                    <p className="text-blue-600 font-medium text-sm">{doc.specialty}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <p className="flex items-center gap-2 overflow-hidden">
                                    <span aria-hidden="true">📧</span>
                                    <span className="truncate break-all" title={doc.email}>{doc.email}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span aria-hidden="true">📞</span> {doc.contact || 'No contact provided'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span aria-hidden="true">📅</span> {doc.availability || 'Mon-Fri'}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-black tracking-wider ${doc.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {doc.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                {localStorage.getItem('role') === 'admin' && (
                                    <Link
                                        to={`/admin/doctors/edit/${doc.id}`}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-bold transition"
                                        aria-label={`Edit profile for ${doc.name}`}
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}

export default Doctors;