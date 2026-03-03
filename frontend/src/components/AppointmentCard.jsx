function AppointmentCard({ appointment }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center mb-3">
            <div>
                <h3 className="font-bold text-gray-800">{appointment.patientName}</h3>
                <p className="text-sm text-gray-500">{appointment.date} at {appointment.time}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${appointment.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {appointment.status}
            </span>
        </div>
    );
}
export default AppointmentCard;