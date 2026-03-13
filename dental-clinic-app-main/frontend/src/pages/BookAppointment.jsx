import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Task 5: Skeleton Loader for the Form ---
const SkeletonForm = () => (
    <div className="animate-pulse space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-xl">
        <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
        <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 rounded-xl"></div>
            <div className="h-10 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
        <div className="h-14 bg-gray-300 rounded-2xl w-full"></div>
    </div>
);

function BookAppointment() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    const [form, setForm] = useState({
        patient_id: '',
        dentist_id: '',
        appointment_date: '',
        appointment_time: '',
        timezone: 'Asia/Karachi',
        treatment_type: '',
        notes: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [pRes, dRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/patients`),
                    fetch(`${API_BASE_URL}/api/doctors`)
                ]);
                const pData = await pRes.json();
                const dData = await dRes.json();
                setPatients(pData);
                setDoctors(dData);
            } catch (err) {
                setError("Failed to load clinic data. Is the backend running?");
            } finally {
                setLoadingData(false);
            }
        };
        fetchInitialData();
    }, [API_BASE_URL]);

    useEffect(() => {
        const fetchSlots = async () => {
            if (form.dentist_id && form.appointment_date) {
                setFetchingSlots(true);
                setError('');
                try {
                    const res = await fetch(`${API_BASE_URL}/api/appointments/available-slots?dentist_id=${form.dentist_id}&date=${form.appointment_date}`);
                    const data = await res.json();
                    if (res.ok) {
                        setAvailableSlots(data.available_slots || []);
                    } else {
                        throw new Error(data.error || "Failed to fetch slots");
                    }
                } catch (err) {
                    setError("Error checking calendar availability: " + err.message);
                } finally {
                    setFetchingSlots(false);
                }
            }
        };
        fetchSlots();
    }, [form.dentist_id, form.appointment_date, API_BASE_URL]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Booking failed.");
            }

            setSuccess("✅ Appointment confirmed and added to Google Calendar!");
            setTimeout(() => navigate('/appointments'), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        /* Responsive Padding: p-4 on mobile, p-8 on desktop */
        <div className="p-4 sm:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-6 sm:mb-8 text-center">Schedule a Visit</h1>

            {loadingData ? (
                <SkeletonForm />
            ) : (
                /* Responsive Form Padding: p-4 on mobile, p-8 on desktop */
                <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-8 rounded-2xl shadow-xl border border-gray-100">

                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-sm mb-4" role="alert">❌ {error}</div>}
                    {success && <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-200 text-sm mb-4" role="status">{success}</div>}

                    <div>
                        <label htmlFor="patient-select" className="block text-sm font-bold text-gray-700 mb-1">Select Patient</label>
                        <select id="patient-select" name="patient_id" value={form.patient_id} onChange={handleChange} required
                            className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none">
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="doctor-select" className="block text-sm font-bold text-gray-700 mb-1">Select Doctor</label>
                        <select id="doctor-select" name="dentist_id" value={form.dentist_id} onChange={handleChange} required
                            className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none">
                            <option value="">-- Choose Doctor --</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialty})</option>)}
                        </select>
                    </div>

                    {/* Responsive Grid: 1 column on mobile, 2 columns on small screens and up */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="visit-date" className="block text-sm font-bold text-gray-700 mb-1">Visit Date</label>
                            <input id="visit-date" type="date" name="appointment_date" value={form.appointment_date} onChange={handleChange} required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="visit-time" className="block text-sm font-bold text-gray-700 mb-1">Available Times</label>
                            <select
                                id="visit-time"
                                name="appointment_time"
                                value={form.appointment_time}
                                onChange={handleChange}
                                required
                                disabled={!form.dentist_id || !form.appointment_date || fetchingSlots}
                                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 outline-none"
                            >
                                <option value="">{fetchingSlots ? '🔍 Checking Google...' : '-- Select Slot --'}</option>
                                {availableSlots.map(slot => (
                                    <option key={slot} value={slot}>{slot}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {availableSlots.length === 0 && form.appointment_date && !fetchingSlots && (
                        <p className="text-xs text-red-500 font-bold mt-1" role="alert">⚠️ No free slots for this day.</p>
                    )}

                    <div>
                        <label htmlFor="treatment-type" className="block text-sm font-bold text-gray-700 mb-1">Purpose of Visit</label>
                        <input id="treatment-type" type="text" name="treatment_type" value={form.treatment_type} onChange={handleChange}
                            placeholder="e.g. Scaling, Root Canal"
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || availableSlots.length === 0}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 disabled:bg-blue-300 shadow-lg transition focus:ring-4 focus:ring-blue-200"
                    >
                        {submitting ? 'Confirming...' : 'CONFIRM APPOINTMENT'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default BookAppointment;