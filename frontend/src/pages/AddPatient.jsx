import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddPatient() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- TASK 6 FIX: Get the Backend URL from Environment Variables ---
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

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.name || !form.email || !form.phone) {
            setError('Name, email, and phone are required.');
            return;
        }

        setSubmitting(true);
        try {
            // FIXED: Use absolute URL with backticks
            const res = await fetch(`${API_BASE_URL}/api/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.errors?.join(', ') || data.error || 'Failed to create patient');
            }

            setSuccess('✅ Patient created successfully!');
            setTimeout(() => navigate('/patients'), 1200);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Add New Patient</h1>

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange} required placeholder="0300-1234567"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 f