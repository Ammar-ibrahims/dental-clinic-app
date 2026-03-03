function AppointmentForm() {
    return (
        <form className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">Book New Appointment</h2>
            <input type="text" placeholder="Patient Name" className="w-full p-2 border rounded" />
            <input type="date" className="w-full p-2 border rounded" />
            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                Confirm Booking
            </button>
        </form>
    );
}
export default AppointmentForm;