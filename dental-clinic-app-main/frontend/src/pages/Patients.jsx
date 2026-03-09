import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    // Same pattern as Dashboard
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/patients`);

                if (!res.ok) {
                    const text = await res.text();
                    console.error("Server returned error:", res.status, text);
                    throw new Error(`Failed to load patients (Status: ${res.status})`);
                }

                const data = await res.json();
                setPatients(data);

            } catch (err) {
                console.error("Fetch Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [API_BASE_URL]);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Patients</h1>

                <Link
                    to="/patients/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                >
                    + Add Patient
                </Link>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="text-red-500">❌ {error}</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {patients.map((p) => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium">{p.name}</td>
                                    <td className="p-4">{p.email}</td>
                                    <td className="p-4">{p.phone}</td>

                                    <td className="p-4 text-right">
                                        <Link
                                            to={`/patients/${p.id}/edit`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );


}

export default Patients;
