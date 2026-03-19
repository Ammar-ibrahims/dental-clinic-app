import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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

    const handleContactChange = (e) => {
        let digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
        if (digits.length > 4) {
            digits = digits.slice(0, 4) + '-' + digits.slice(4);
        }
        setForm({ ...form, contact: digits });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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
            const res = await fetch(`${API_BASE_URL}/api/doctors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server did not return JSON. Ensure backend is running.");
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create doctor');

            setSuccess('✅ Doctor added successfully!');

            setTimeout(() => {
                if (form.connect_google_calendar && data.id) {
                    window.location.href = `${API_BASE_URL}/api/auth/google?dentist_id=${data.id}&email=${form.email}`;
                } else {
                    navigate('/admin/doctors');
                }
            }, 1200);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        /* Changed p-8 to p-4 for mobile, sm:p-8 for desktop */
        <div className="p-4 sm:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Add New Doctor</h1>

            {/* Changed p-6 to p-4 for mobile */}
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">

                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4" role="alert">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4" role="status">{success}</div>}

                <div>
                    <label htmlFor="doc-name" className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input id="doc-name" type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Dr. Full Name"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Responsive Grid: 1 column on mobile, 2 columns on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="doc-specialty" className="block text-sm font-semibold text-gray-700 mb-1">Specialty <span className="text-red-500">*</span></label>
                        <input id="doc-specialty" type="text" name="specialty" value={form.specialty} onChange={handleChange} required
                            placeholder="e.g. Orthodontist"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label htmlFor="doc-exp" className="block text-sm font-semibold text-gray-700 mb-1">Years of Experience</label>
                        <input id="doc-exp" type="number" name="years_experience" value={form.years_experience} onChange={handleChange}
                            min="0" placeholder="0"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="doc-email" className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input id="doc-email" type="email" name="email" value={form.email} onChange={handleChange} required
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label htmlFor="doc-phone" className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                        <input id="doc-phone" type="text" name="contact" value={form.contact} onChange={handleContactChange} placeholder="0300-1234567" maxLength={12}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            name="connect_google_calendar"
                            checked={form.connect_google_calendar}
                            onChange={handleChange}
                            id="connect_calendar"
                            className="w-5 h-5 mt-0.5 cursor-pointer accent-blue-600"
                        />
                        <label htmlFor="connect_calendar" className="text-sm font-bold text-gray-800 cursor-pointer">
                            Connect Google Calendar immediately after saving
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-7 mt-1">
                        Enabling this will redirect you to Google to authorize calendar access.
                    </p>
                </div>

                <div>
                    <label htmlFor="doc-bio" className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                    <textarea id="doc-bio" name="bio" value={form.bio} onChange={handleChange} rows={3}
                        placeholder="Short biography..."
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={() => navigate('/admin/doctors')}
                        className="w-full sm:w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                        className="w-full sm:w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition shadow-md">
                        {submitting ? 'Adding Doctor...' : 'Add Doctor'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddDoctor;