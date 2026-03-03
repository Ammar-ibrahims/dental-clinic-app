function DoctorCard({ doctor }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-blue-600">{doctor.name}</h3>
            <p className="text-gray-600 font-medium">{doctor.specialty}</p>
            <div className="mt-3 text-sm text-gray-400">
                📅 Available: {doctor.availability}
            </div>
        </div>
    );
}
export default DoctorCard;