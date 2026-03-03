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
        availability: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
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
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.errors?.join(', ') || data.error || 'Failed to create doctor');
            }
            setSuccess('✅ Doctor added successfully!');
            setTimeout(() => navigate('/doctors'), 1200);
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

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
                    <input type="text" name="availability" value={form.availability} onChange={handleChange}
                        placeholder="e.g. Mon, Wed, Fri"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

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
            </form>
        </div>
    );
}

export default AddDoctor;
