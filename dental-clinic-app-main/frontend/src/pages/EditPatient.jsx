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

function EditPatient({ isPatientPortal = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [fileWarning, setFileWarning] = useState('');
    const [deleteCurrentFile, setDeleteCurrentFile] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    // Extract filename from S3 URL (e.g., "1710321234567_report.pdf" -> "report.pdf")
    const getFileNameFromUrl = (url) => {
        if (!url) return '';
        const parts = url.split('/');
        const fullName = parts[parts.length - 1].split('?')[0];
        const underscoreIndex = fullName.indexOf('_');
        return underscoreIndex > -1 ? fullName.substring(underscoreIndex + 1) : fullName;
    };

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
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error(`Patient not found or access denied`);
                const data = await res.json();

                setForm({
                    ...data,
                    date_of_birth: data.date_of_birth ? data.date_of_birth.slice(0, 10) : '',
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
        const { name, value } = e.target;

        if (name === 'phone') {
            // Remove all non-digits
            const digits = value.replace(/\D/g, '');
            // Limit to 11 digits
            const limited = digits.slice(0, 11);

            // Format: 0300-0000000
            let formatted = limited;
            if (limited.length > 4) {
                formatted = `${limited.slice(0, 4)}-${limited.slice(4)}`;
            }

            setForm({ ...form, phone: formatted });
            return;
        }

        setForm({ ...form, [name]: value });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(e.target.files);
        setFileWarning('');
        if (files.length > 0) setDeleteCurrentFile(false);

        const pdfCount = files.filter(f => f.type === 'application/pdf').length;
        if (pdfCount > 1) {
            setFileWarning('⚠️ You have selected multiple PDF files. Please upload them as a single compressed ZIP folder instead.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        if (fileWarning) {
            setError('Please resolve the file upload warning before saving.');
            return;
        }

        // DOB Validation: Can't be in the future
        if (form.date_of_birth) {
            const selectedDate = new Date(form.date_of_birth);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate > today) {
                setError('❌ Date of Birth cannot be in the future.');
                return;
            }
        }

        if (!form.name || !form.email || !form.phone) {
            setError('Name, email, and phone are required.');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // Append form fields
            Object.keys(form).forEach(key => {
                if (key !== 'document_url') {
                    formData.append(key, form[key]);
                }
            });

            // Append files
            if (selectedFiles) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    formData.append('patient_file', selectedFiles[i]);
                }
            }

            // Deletion flag
            if (deleteCurrentFile) {
                formData.append('delete_current_file', 'true');
            }

            const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!res.ok) throw new Error('Update failed');

            setSuccess('✅ Patient updated successfully!');
            setTimeout(() => navigate(isPatientPortal ? '/patient/profile' : '/admin/patients'), 1500);
        } catch (err) {
            setError('❌ ' + err.message);
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete this patient.")) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Delete failed');

            setSuccess('🗑️ Patient deleted successfully.');
            setTimeout(() => navigate('/admin/patients'), 1500);
        } catch (err) {
            setError('❌ ' + err.message);
            setSubmitting(false);
        }
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
                {isPatientPortal ? 'My Profile Settings' : 'Edit Patient Profile'}
            </h1>

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
                                max={new Date().toISOString().split("T")[0]}
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

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="patient_file" className="block text-sm font-semibold text-gray-700">
                                Medical Documents (PDF/ZIP)
                            </label>
                            {form.document_url && !deleteCurrentFile && (
                                <div className="flex items-center gap-2">
                                    <a
                                        href={form.document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-bold text-blue-600 bg-white px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition flex items-center gap-1"
                                    >
                                        📄 {getFileNameFromUrl(form.document_url)}
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteCurrentFile(true)}
                                        className="text-red-500 hover:text-red-700 bg-white p-1 rounded border border-red-100 shadow-sm transition"
                                        title="Delete current file"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                            {deleteCurrentFile && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 italic">
                                    File marked for deletion
                                </span>
                            )}
                        </div>
                        <input
                            id="patient_file"
                            type="file"
                            name="patient_file"
                            onChange={handleFileChange}
                            accept=".pdf,.zip"
                            multiple
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 w-full"
                        />

                        {/* Selected Files List */}
                        {selectedFiles && selectedFiles.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">New Selection:</p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(selectedFiles).map((file, idx) => (
                                        <div key={idx} className="bg-white border border-blue-200 px-3 py-1 rounded-full text-[12px] text-blue-700 flex items-center shadow-sm">
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                            <span className="ml-2 text-[10px] opacity-60">({(file.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {fileWarning && <p className="mt-2 text-xs text-orange-600 font-bold">{fileWarning}</p>}
                        <p className="mt-2 text-[10px] text-gray-400 italic">
                            Max 1 ZIP or multiple PDFs (ZIP preferred for multiple documents)
                        </p>
                    </div>

                    {/* Responsive Buttons: Stacked on mobile, side-by-side on desktop */}
                    <div className="pt-4 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => navigate(isPatientPortal ? '/patient/profile' : '/admin/patients')}
                                className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="w-full sm:flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition shadow-md">
                                {submitting ? 'Processing...' : (isPatientPortal ? 'Save Changes' : 'Update Patient')}
                            </button>
                        </div>

                        {!isPatientPortal && (
                            <button type="button" onClick={handleDelete} disabled={submitting}
                                className="w-full bg-white text-red-600 border border-red-600 py-3 rounded-lg font-bold hover:bg-red-50 transition mt-2">
                                Delete Patient Record
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

export default EditPatient;