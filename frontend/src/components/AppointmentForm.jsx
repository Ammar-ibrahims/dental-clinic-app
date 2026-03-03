import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AppointmentForm() {
    const navigate = useNavigate();

    const [dentists, setDentists] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        patient_id: '',
        dentist_id: '',
        appointment_date: '',
        appointment_time: '',
        treatment_type: '',
        notes: '',
    });

    // Fetch dentists and patients for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dentistsRes, patientsRes] = await Promise.all([
                    fetch('/api/dentists'),
                    fetch('/api/patients'),
                ]);
                if (!dentistsRes.ok) throw new Error('Failed to load dentists');
                if (!patientsRes.ok) throw new Error('Failed to load patients');
                const dentistsData = await dentistsRes.json();
                const patientsData = await patientsRes.json();
                setDentists(dentistsData);
                setPatients(patientsData);
            } catch (err) {
                setError('Could not load form data: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.patient_id || !form.dentist_id || !form.appointment_date || !form.appointment_time) {
            setError('Please fill in all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: parseInt(form.patient_id),
                    dentist_id: parseInt(form.dentist_id),
                    appointment_date: form.appointment_date,
                    appointment_time: form.appointment_time,
                    treatment_type: form.treatment_type,
                    notes: form.notes,
                    status: 'Pending',
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to book appointment');
            }

            setSuccess('✅ Appointment booked successfully!');
            setTimeout(() => navigate('/appointments'), 1500);
        } catch (err) {
            setError('❌ ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                Loading form data...
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
            <h2 className="text-xl font-bold mb-4">Book New Appointment</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
                    {success}
                </div>
            )}

            {/* Patient */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Patient <span className="text-red-500">*</span>
                </label>
                <select
                    name="patient_id"
                    value={form.patient_id}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Dentist */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Dentist <span className="text-red-500">*</span>
                </label>
                <select
                    name="dentist_id"
                    value={form.dentist_id}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <option value="">-- Select Dentist --</option>
                    {dentists.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name} — {d.specialty}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    name="appointment_date"
                    value={form.appointment_date}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Time */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                </label>
                <input
                    type="time"
                    name="appointment_time"
                    value={form.appointment_time}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Treatment Type */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Treatment Type
                </label>
                <input
                    type="text"
                    name="treatment_type"
                    value={form.treatment_type}
                    onChange={handleChange}
                    placeholder="e.g. Cleaning, Filling, Extraction"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Notes
                </label>
                <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional notes..."
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition"
            >
                {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
        </form>
    );
}

export default AppointmentForm;