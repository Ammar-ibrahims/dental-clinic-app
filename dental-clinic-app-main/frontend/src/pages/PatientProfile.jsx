import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PatientProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/patients/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load profile');
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [API_BASE_URL]);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading your profile...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-black text-gray-800 mb-8 tracking-tight">My Information</h1>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">⚠️ {error}</div>}

            {profile && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-blue-600 p-8 text-white">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl">
                                🧑
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{profile.name}</h2>
                                <p className="opacity-80">{profile.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Contact Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Phone Number</p>
                                    <p className="font-bold text-gray-800">{profile.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Address</p>
                                    <p className="font-bold text-gray-800">{profile.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Medical Summary</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Gender / Age / Blood Group</p>
                                    <p className="font-bold text-gray-800">{profile.gender || 'Unknown'} / {profile.age || 'N/A'} / {profile.blood_group || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Medical History</p>
                                    <p className="font-bold text-gray-800 text-sm leading-relaxed">
                                        {profile.medical_history || 'No history recorded.'}
                                    </p>
                                </div>
                                {profile.document_url && (
                                    <div className="pt-2">
                                        <p className="text-sm text-gray-500 mb-2">Medical Reports</p>
                                        <a
                                            href={profile.document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100 hover:bg-blue-100 transition shadow-sm"
                                        >
                                            📄 View/Download Report
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50 border-t flex justify-end">
                        <button
                            onClick={() => navigate(`/patient/profile/edit/${profile.id}`)}
                            className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-50 transition"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientProfile;
