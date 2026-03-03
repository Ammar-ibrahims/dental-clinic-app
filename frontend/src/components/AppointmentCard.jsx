import { Link } from 'react-router-dom';

function AppointmentCard({ appointment, onDelete }) {
    const statusColors = {
        Confirmed: 'bg-green-100 text-green-700',
        Pending: 'bg-yellow-100 text-yellow-700',
        Cancelled: 'bg-red-100 text-red-700',
        Completed: 'bg-blue-100 text-blue-700',
    };

    const colorClass = statusColors[appointment.status] || 'bg-gray-100 text-gray-700';

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center mb-3">
            <div>
                <h3 className="font-bold text-gray-800">{appointment.patient_name}</h3>
                <p className="text-sm text-gray-500">
                    Dr. {appointment.dentist_name}
                    {appointment.specialty ? ` — ${appointment.specialty}` : ''}
                </p>
                <p className="text-sm text-gray-400">
                    {appointment.appointment_date
                        ? new Date(appointment.appointment_date).toLocaleDateString()
                        : ''}
                    {appointment.appointment_time ? ` at ${appointment.appointment_time}` : ''}
                </p>
                {appointment.treatment_type && (
                    <p className="text-xs text-gray-400 italic mt-1">{appointment.treatment_type}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                    {appointment.status}
                </span>
                <Link
                    to={`/appointments/${appointment.id}/edit`}
                    className="text-blue-400 hover:text-blue-600 text-sm font-bold px-2 py-1 rounded hover:bg-blue-50 transition"
                    title="Edit status"
                >
                    ✎
                </Link>
                {onDelete && (
                    <button
                        onClick={() => onDelete(appointment.id)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded hover:bg-red-50 transition"
                        title="Delete appointment"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

export default AppointmentCard;