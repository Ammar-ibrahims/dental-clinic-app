import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Generate 30-min slots from 09:00 to 16:30
const generateAllSlots = () => {
    const slots = [];
    for (let h = 9; h <= 16; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
};

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
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
        treatment_type: '',
        notes: '',
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

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

    // Fetch available slots when Dentist AND Date are selected
    useEffect(() => {
        const fetchSlots = async () => {
            if (!form.dentist_id || !form.appointment_date) {
                setAvailableSlots([]);
                // Do not reset appointment_time here, otherwise user loses selection if date re-renders
                return;
            }

            setLoadingSlots(true);
            try {
                const res = await fetch(`/api/appointments/slots?dentist_id=${form.dentist_id}&date=${form.appointment_date}&timezone=${form.timezone}`);
                if (!res.ok) throw new Error('Failed to fetch available slots');

                const data = await res.json();
                const bookedSlots = data.booked_slots || [];

                // Available = All possible slots MINUS booked slots
                const allSlots = generateAllSlots();
                const freeSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

                setAvailableSlots(freeSlots);

                // If previously selected time is no longer available, clear it
                if (form.appointment_time && !freeSlots.includes(form.appointment_time.slice(0, 5))) {
                    setForm(prev => ({ ...prev, appointment_time: '' }));
                }
            } catch (err) {
                setError('Could not load available time slots: ' + err.message);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [form.dentist_id, form.appointment_date, form.timezone]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSlotClick = (slot) => {
        setForm({ ...form, appointment_time: slot });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.patient_id || !form.dentist_id || !form.appointment_date || !form.appointment_time) {
            setError('Please complete all required fields (including selecting a time slot).');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: form.patient_id, // Keep as string for MongoDB IDs
                    dentist_id: parseInt(form.dentist_id),
                    appointment_date: form.appointment_date,
                    // If slot is "09:00", append ":00" for postgres TIME format just to be safe, though "09:00" works.
                    appointment_time: form.appointment_time,
                    timezone: form.timezone,
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
                    // Calculate today's date in local time, not UTC (which causes off-by-one errors)
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Timezone */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Timezone <span className="text-red-500">*</span>
                </label>
                <select
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                >
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris (CET/CEST)</option>
                    <option value="Asia/Karachi">Pakistan Standard Time (PKT)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                </select>
            </div>

            {/* Time Slot Picker */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                </label>

                {!form.dentist_id || !form.appointment_date ? (
                    <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded border border-gray-200">
                        Please select a Dentist and Date to see available time slots.
                    </p>
                ) : loadingSlots ? (
                    <p className="text-sm text-gray-500 p-3">Checking availability...</p>
                ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-red-500 italic bg-red-50 p-3 rounded border border-red-200">
                        No available slots for this date. Please select another date.
                    </p>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                        {availableSlots.map((slot) => {
                            const isSelected = form.appointment_time === slot || form.appointment_time === slot + ":00";
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => handleSlotClick(slot)}
                                    className={`py-2 rounded text-sm font-semibold transition ${isSelected
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                        : 'bg-white border text-gray-700 hover:border-blue-500 hover:text-blue-600'
                                        }`}
                                >
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Hidden input to ensure native required validation still works */}
                <input type="text" name="appointment_time" value={form.appointment_time} readOnly required className="sr-only" />
            </div>

            {/* Treatment Type */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 mt-4">
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