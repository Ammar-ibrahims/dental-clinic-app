import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- Task 5: Skeleton Row Component ---
const SkeletonRow = () => (
    <tr className="animate-pulse border-b">
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="p-4 text-center"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
        <td className="p-4 text-center">
            <div className="flex justify-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
        </td>
    </tr>
);

function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = 'http://16.170.201.132:8000/api';

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/patients`);
            if (!res.ok) throw new Error(`Failed to load patients`);
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : data.patients || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This will delete all records for this patient.")) {
            try {
                const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    setPatients(patients.filter(p => p.id !== id));
                    alert("Patient deleted successfully");
                } else {
                    alert("Failed to delete patient");
                }
            } catch (err) {
                console.error("Delete error:", err);
            }
        }
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">

            {/* Responsive Header: Stacks vertically on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Patients</h1>
                <Link
                    to="/patients/new"
                    className="w-full sm:w-auto text-center bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md focus:ring-4 focus:ring-blue-300 outline-none"
                    aria-label="Add a new patient"
                >
                    + Add Patient
                </Link>
            </div>

            {error ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200" role="alert">
                    <p className="text-red-500 font-medium">❌ Error: {error}</p>
                    <button
                        onClick={fetchPatients}
                        className="mt-2 text-sm text-red-600 underline"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

                    {/* --- RESPONSIVE TABLE WRAPPER --- */}
                    {/* This allows horizontal scrolling on small screens so the table doesn't break */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]" aria-busy={loading}>
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th scope="col" className="p-4 text-gray-600 font-semibold">Name</th>
                                    <th scope="col" className="p-4 text-gray-600 font-semibold">Email</th>
                                    <th scope="col" className="p-4 text-gray-600 font-semibold">Phone</th>
                                    <th scope="col" className="p-4 text-center text-gray-600 font-semibold">Medical Report</th>
                                    <th scope="col" className="p-4 text-center text-gray-600 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : patients.length > 0 ? (
                                    patients.map((p) => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-gray-800">{p.name}</td>
                                            <td className="p-4 text-gray-600">{p.email}</td>
                                            <td className="p-4 text-gray-600">{p.phone}</td>

                                            <td className="p-4 text-center">
                                                {p.document_url ? (
                                                    <a
                                                        href={p.document_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-green-200 transition"
                                                        aria-label={`View medical report for ${p.name}`}
                                                    >
                                                        View Report
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-300 text-xs italic">No File</span>
                                                )}
                                            </td>

                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-4">
                                                    <Link
                                                        to={`/patients/edit/${p.id}`}
                                                        className="text-blue-600 font-bold hover:underline focus:outline-blue-500"
                                                        aria-label={`Edit ${p.name}`}
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="text-red-500 font-bold hover:underline focus:outline-red-500"
                                                        aria-label={`Delete ${p.name}`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            No patients found. Click "+ Add Patient" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Patients;