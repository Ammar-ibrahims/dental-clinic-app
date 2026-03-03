import { appointments } from '../mockData';
import { Link } from 'react-router-dom'; // Import Link
import AppointmentCard from '../components/AppointmentCard';

function Appointments() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Appointments List</h1>
                {/* This button takes the user to the new route */}
                <Link
                    to="/appointments/new"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                    + Book New Appointment
                </Link>
            </div>

            <div className="space-y-4">
                {appointments.map(appt => (
                    <AppointmentCard key={appt.id} appointment={appt} />
                ))}
            </div>
        </div>
    );
}
export default Appointments;