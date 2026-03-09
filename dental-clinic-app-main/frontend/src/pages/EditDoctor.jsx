import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditDoctor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'google_connected') {
            setSuccess('✅ Google Calendar connected successfully!');
            // Clean up URL
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
                const res = await fetch(`/api/dentists/${id}`);
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
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!form.name || !form.specialty || !form.email) {
            setError('Name, specialty, and email are required.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                years_experience: form.years_experience ? parseInt(form.years_experience) : 0,
            };
            const res = await fetch(`/api/dentists/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.errors?.join(', ') || data.error || 'Update failed');
            }
            setSuccess('✅ Doctor updated!');
            setTimeout(() => navigate('/doctors'), 1200);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>;

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Edit Doctor</h1>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Specialty <span className="text-red-500">*</span></label>
                    <input type="text" name="specialty" value={form.specialty} onChange={handleChange} required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact</label>
                    <input type="text" name="contact" value={form.contact} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                    <input type="number" name="years_experience" value={form.years_experience} onChange={handleChange} min="0" className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
                    <input type="text" name="availability" value={form.availability} onChange={handleChange} placeholder="e.g. Mon, Wed, Fri" className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" className="w-4 h-4" />
                    <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">Active</label>
                </div>

                {/* Google Calendar Connect */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Google Calendar Integration</h3>
                    <p className="text-sm text-gray-500 mb-4">Connect your Google Calendar to automatically block off time when you have other events scheduled, and let us add new appointments directly to your calendar.</p>
                    <a
                        href={`/api/auth/google?dentist_id=${id}&email=${form.email}`}
                        className="inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-semibold text-sm transition"
                    >
                        📅 Connect Google Calendar
                    </a>
                </div>

                <div className="pt-6">
                    <button type="submit" disabled={submitting}
                        className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                        {submitting ? 'Saving...' : 'Update Doctor'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditDoctor;
