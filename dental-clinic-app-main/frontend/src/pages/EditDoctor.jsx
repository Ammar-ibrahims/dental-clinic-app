import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- Task 5: Skeleton Loader for the Edit Form ---
const SkeletonEditDoctor = () => (
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

function EditDoctor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'google_connected') {
            setSuccess('✅ Google Calendar connected successfully!');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const [form, setForm] = useState({
        name: '', specialty: '', email: '', contact: '',
        bio: '', years_experience: '', availability: '', is_active: true,
    });

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/doctors/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Doctor not found');
                const data = await res.json();
                setForm({
                    name: data.name || '',
                    specialty: data.specialty || '',
                    email: data.email || '',
                    contact: data.contact || '',
                    bio: data.bio || '',
                    years_experience: data.years_experience ?? '',
                    availability: data.availability || '',
                    is_active: data.is_active ?? true,
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [id, API_BASE_URL]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleContactChange = (e) => {
        let digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
        if (digits.length > 4) {
            digits = digits.slice(0, 4) + '-' + digits.slice(4);
        }
        setForm({ ...form, contact: digits });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!form.name || !form.specialty || !form.email) {
            setError('Name, specialty, and email are required.');
            return;
        }

        const digitsOnly = form.contact.replace(/[^0-9]/g, '');
        if (form.contact && digitsOnly.length !== 11) {
            setError('Contact number must be exactly 11 digits (e.g. 0300-1234567).');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                years_experience: form.years_experience ? parseInt(form.years_experience) : 0,
            };

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/doctors/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Update failed');

            setSuccess('✅ Doctor updated successfully!');
            setTimeout(() => navigate('/admin/doctors'), 1200);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Edit Doctor Profile</h1>

            {loading ? (
                <SkeletonEditDoctor />
            ) : (
                /* Responsive Form Padding: p-4 on mobile, p-6 on desktop */
                <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4" role="alert">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4" role="status">{success}</div>}

                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input id="name" type="text" name="name" value={form.name} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    {/* Responsive Grid: 1 column on mobile, 2 columns on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="specialty" className="block text-sm font-semibold text-gray-700 mb-1">Specialty <span className="text-red-500">*</span></label>
                            <input id="specialty" type="text" name="specialty" value={form.specialty} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="exp" className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                            <input id="exp" type="number" name="years_experience" value={form.years_experience} onChange={handleChange} min="0" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 mb-1">Contact</label>
                            <input id="contact" type="text" name="contact" value={form.contact} onChange={handleContactChange} placeholder="0300-1234567" maxLength={12} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="availability" className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
                        <input id="availability" type="text" name="availability" value={form.availability} onChange={handleChange} placeholder="e.g. Mon, Wed, Fri" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                        <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} rows={3} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                        <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" className="w-5 h-5 cursor-pointer accent-blue-600" />
                        <label htmlFor="is_active" className="text-sm font-bold text-gray-700 cursor-pointer">Profile Active</label>
                    </div>

                    {/* Google Calendar Section - Responsive Button */}
                    <div className="mt-4 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Integrations</h3>
                        <a
                            href={`${API_BASE_URL}/api/auth/google?dentist_id=${id}&email=${form.email}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-3 sm:py-2 rounded-lg shadow-sm hover:bg-gray-50 font-bold text-sm transition"
                        >
                            📅 Connect Google Calendar
                        </a>
                    </div>

                    {/* Responsive Buttons: Stacked on mobile, side-by-side on desktop */}
                    <div className="pt-6 flex flex-col sm:flex-row gap-3">
                        <button type="button" onClick={() => navigate('/admin/doctors')}
                            className="w-full sm:w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="w-full sm:w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition shadow-md">
                            {submitting ? 'Saving...' : 'Update Doctor'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default EditDoctor;