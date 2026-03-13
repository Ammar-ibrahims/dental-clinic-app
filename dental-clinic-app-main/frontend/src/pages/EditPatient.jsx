import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- Task 5: Skeleton Loader for the Edit Form ---
const SkeletonEditPatient = () => (
    <div className="animate-pulse space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
        <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-100 rounded-lg"></div>
            <div className="h-10 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-24 bg-gray-100 rounded-lg w-full"></div>
        <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
    </div>
);

function EditPatient() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        gender: '',
        blood_group: '',
        medical_history: '',
    });

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/patients/${id}`);
                if (!res.ok) throw new Error(`Patient not found`);
                const data = await res.json();

                setForm({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    date_of_birth: data.date_of_birth ? data.date_of_birth.slice(0, 10) : '',
                    address: data.address || '',
                    gender: data.gender || '',
                    blood_group: data.blood_group || '',
                    medical_history: data.medical_history || '',
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPatient();
    }, [id, API_BASE_URL]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        if (!form.name || !form.email || !form.phone) {
            setError('Name, email, and phone are required.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error('Update failed');

            setSuccess('✅ Patient updated successfully!');
            setTimeout(() => navigate('/patients'), 1500);
        } catch (err) {
            setError('❌ ' + err.message);
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete this patient.")) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');

            setSuccess('🗑️ Patient deleted successfully.');
            setTimeout(() => navigate('/patients'), 1500);
        } catch (err) {
            setError('❌ ' + err.message);
            setSubmitting(false);
        }
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Edit Patient Profile</h1>

            {loading ? (
                <SkeletonEditPatient />
            ) : (
                /* Responsive Form Padding: p-4 on mobile, p-6 on desktop */
                <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4" role="alert">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4" role="status">{success}</div>}

                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input id="name" type="text" name="name" value={form.name} onChange={handleChange} required
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    {/* Responsive Grid: 1 column on mobile, 2 columns on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                            <input id="phone" type="text" name="phone" value={form.phone} onChange={handleChange} required
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dob" className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                            <input id="dob" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                            <select id="gender" name="gender" value={form.gender} onChange={handleChange}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none">
                                <option value="">-- Select --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="blood_group" className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                        <select id="blood_group" name="blood_group" value={form.blood_group} onChange={handleChange}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none">
                            <option value="">-- Select --</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                        <input id="address" type="text" name="address" value={form.address} onChange={handleChange}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="medical_history" className="block text-sm font-semibold text-gray-700 mb-1">Medical History</label>
                        <textarea id="medical_history" name="medical_history" value={form.medical_history} onChange={handleChange} rows={3}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="Allergies, chronic diseases, past surgeries..." />
                    </div>

                    {/* Responsive Buttons: Stacked on mobile, side-by-side on desktop */}
                    <div className="pt-4 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => navigate('/patients')}
                                className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="w-full sm:flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition shadow-md">
                                {submitting ? 'Processing...' : 'Update Patient'}
                            </button>
                        </div>

                        <button type="button" onClick={handleDelete} disabled={submitting}
                            className="w-full bg-white text-red-600 border border-red-600 py-3 rounded-lg font-bold hover:bg-red-50 transition mt-2">
                            Delete Patient Record
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default EditPatient;