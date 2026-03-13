import { Link } from 'react-router-dom';

function AppointmentCard({ appointment, onDelete }) {
    const statusColors = {
        Confirmed: 'bg-green-100 text-green-700',
        Pending: 'bg-yellow-100 text-yellow-700',
        Cancelled: 'bg-red-100 text-red-700',
        Completed: 'bg-blue-100 text-blue-700',
    };

    const colorClass = statusColors[appointment?.status] || 'bg-gray-100 text-gray-700';

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center mb-3 hover:shadow-md transition">
            <div>
                <h3 className="font-bold text-gray-800">
                    {/* Backend sends patient_name from MongoDB/SQL enrichment */}
                    {appointment?.patient_name || appointment?.name || 'Unnamed Patient'}
                </h3>
                <p className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Dr. {appointment?.dentist_name || 'Doctor'}</span>
                    {appointment?.specialty ? ` — ${appointment.specialty}` : ''}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    📅 {appointment?.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString() : 'N/A'}
                    {appointment?.appointment_time ? ` at ${appointment.appointment_time.slice(0, 5)}` : ''}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                    {appointment?.status || 'Pending'}
                </span>

                {/* FIXED: Path swapped to match App.jsx route pattern */}
                <Link
                    to={`/appointments/edit/${appointment?.id}`}
                    className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition"
                    title="Edit Appointment"
                >
                    ✎
                </Link>

                {onDelete && (
                    <button
                        onClick={() => onDelete(appointment.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition"
                        title="Delete"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

export default AppointmentCard;