import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditPatient() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        name: '', email: '', phone: '', date_of_birth: '',
        address: '', gender: '', blood_group: '', medical_history: '',
    });

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const res = await fetch(`/api/patients/${id}`);
                if (!res.ok) throw new Error('Patient not found');
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
    }, [id]);

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
            const res = await fetch(`/api/patients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.errors?.join(', ') || data.error || 'Update failed');
            }
            setSuccess('✅ Patient updated!');
            setTimeout(() => navigate('/patients'), 1200);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>;

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Edit Patient</h1>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange} required className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">-- Select --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                    <select name="blood_group" value={form.blood_group} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">-- Select --</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Medical History</label>
                    <textarea name="medical_history" value={form.medical_history} onChange={handleChange} rows={3} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <button type="submit" disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition">
                    {submitting ? 'Saving...' : 'Update Patient'}
                </button>
            </form>
        </div>
    );
}

export default EditPatient;
