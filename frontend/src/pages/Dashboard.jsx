import { doctors, appointments } from '../mockData';

function Dashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Clinic Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h2 className="text-blue-800 font-bold text-lg">Total Doctors</h2>
                    <p className="text-5xl font-black text-blue-600 mt-2">{doctors.length}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                    <h2 className="text-green-800 font-bold text-lg">Today's Appointments</h2>
                    <p className="text-5xl font-black text-green-600 mt-2">{appointments.length}</p>
                </div>
            </div>
        </div>
    );
}
export default Dashboard;