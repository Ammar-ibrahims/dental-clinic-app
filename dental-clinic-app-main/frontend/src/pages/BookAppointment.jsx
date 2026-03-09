import AppointmentForm from '../components/AppointmentForm';

function BookAppointment() {
    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Schedule a Visit</h1>
            {/* We reuse the form component here! */}
            <AppointmentForm />
        </div>
    );
}
export default BookAppointment;