import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AddPatient() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const today = new Date().toISOString().split('T')[0];

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
        const { name, value } = e.target;
        if (name === 'phone') {
            let nums = value.replace(/[^0-9]/g, '');
            if (nums.length > 11) nums = nums.substring(0, 11);
            let formatted = nums;
            if (nums.length > 4) {
                formatted = nums.substring(0, 4) + '-' + nums.substring(4);
            }
            setForm({ ...form, [name]: formatted });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.name || !form.email || !form.phone) {
            setError('Name, email, and phone are required.');
            return;
        }

        if (form.phone.length !== 12) {
            setError('❌ Phone number must be exactly 11 digits (e.g., 03xx-xxxxxxx).');
            return;
        }

        if (form.date_of_birth && form.date_of_birth > today) {
            setError('❌ Date of Birth cannot be in the future.');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));
        if (selectedFile) formData.append('patient_file', selectedFile);

        try {
            const res = await fetch(`${API_BASE_URL}/api/patients`, {
                method: 'POST',
                body: formData,
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server did not return JSON. Is the backend running?");
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create patient');

            setSuccess('✅ Patient created successfully!');
            setTimeout(() => navigate('/patients'), 1200);
        } catch (err) {
            console.error("Submit Error:", err);
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        /* Changed p-8 to p-4 for mobile, sm:p-8 for desktop */
        <div className="p-4 sm:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Add New Patient</h1>

            {/* Changed p-6 to p-4 for mobile */}
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">

                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4" role="alert">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4" role="status">{success}</div>}

                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input id="name" type="text" name="name" value={form.name} onChange={handleChange} required
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Responsive Grid: 1 column on mobile, 2 columns on small screens and up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                        <input id="phone" type="text" name="phone" value={form.phone} onChange={handleChange} required
                            placeholder="0323-4234239" maxLength="12"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                </div>

                {/* Responsive Grid: 1 column on mobile, 2 columns on small screens and up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dob" className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                        <input id="dob" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} max={today}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                        <select id="gender" name="gender" value={form.gender} onChange={handleChange}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
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
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">-- Select --</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                    <input id="address" type="text" name="address" value={form.address} onChange={handleChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                    <label htmlFor="medical_history" className="block text-sm font-semibold text-gray-700 mb-1">Medical History</label>
                    <textarea id="medical_history" name="medical_history" value={form.medical_history} onChange={handleChange} rows={3}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Allergies, chronic diseases, past surgeries..." />
                </div>

                <div>
                    <label htmlFor="patient_file" className="block text-sm font-semibold text-gray-700 mb-1">Attach Medical Document (X-Ray/Report)</label>
                    <input id="patient_file" type="file" onChange={handleFileChange}
                        className="w-full p-2 border rounded bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* Responsive Buttons: Stacked on mobile, side-by-side on desktop */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={() => navigate('/patients')}
                        className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                        className="w-full sm:flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition shadow-md">
                        {submitting ? 'Creating...' : 'Create Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddPatient;