import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddDoctor() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        name: '',
        specialty: '',
        email: '',
        contact: '',
        bio: '',
        years_experience: '',
        connect_google_calendar: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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
            const res = await fetch('/api/dentists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.errors?.join(', ') || data.error || 'Failed to create doctor');
            }

            setSuccess('✅ Doctor added successfully!');

            setTimeout(() => {
                if (form.connect_google_calendar && data.id) {
                    // Redirect to Google OAuth
                    window.location.href = `/api/auth/google?dentist_id=${data.id}&email=${form.email}`;
                } else {
                    navigate('/doctors');
                }
            }, 1200);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Add New Doctor</h1>

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Dr. Full Name"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Specialty <span className="text-red-500">*</span></label>
                    <input type="text" name="specialty" value={form.specialty} onChange={handleChange} required
                        placeholder="e.g. Orthodontist, General Dentist"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                    <input type="text" name="contact" value={form.contact} onChange={handleChange} placeholder="0300-1234567"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                    <input type="number" name="years_experience" value={form.years_experience} onChange={handleChange}
                        min="0" placeholder="0"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <input
                        type="checkbox"
                        name="connect_google_calendar"
                        checked={form.connect_google_calendar}
                        onChange={handleChange}
                        id="connect_calendar"
                        className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="connect_calendar" className="text-sm font-bold text-gray-800 cursor-pointer">
                        Connect Google Calendar immediately after saving
                    </label>
                </div>
                <p className="text-xs text-gray-500 ml-6 pb-2">
                    Enabling this will redirect you to Google to authorize calendar access so the system can automatically block off busy times and schedule new appointments.
                </p>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                        placeholder="Short biography..."
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                    {submitting ? 'Adding...' : 'Add Doctor'}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Note: You can connect a Google Calendar to this doctor's profile after creation.
                </p>
            </form>
        </div>
    );
}

export default AddDoctor;
