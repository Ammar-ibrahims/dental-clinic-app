import { Link } from 'react-router-dom';

function DoctorCard({ doctor, onDelete }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-blue-600">{doctor.name}</h3>
                    <p className="text-gray-600 font-medium">{doctor.specialty}</p>
                    {doctor.email && (
                        <p className="text-gray-500 text-sm mt-1">📧 {doctor.email}</p>
                    )}
                    {doctor.years_experience > 0 && (
                        <p className="text-gray-500 text-sm">🏥 {doctor.years_experience} years experience</p>
                    )}
                    <div className="mt-3 text-sm text-gray-400">
                        📅 Available: {doctor.availability || 'Not specified'}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link
                        to={`/doctors/${doctor.id}/edit`}
                        className="text-blue-400 hover:text-blue-600 text-sm font-bold px-2 py-1 rounded hover:bg-blue-50 transition"
                        title="Edit doctor"
                    >
                        ✎
                    </Link>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(doctor.id)}
                            className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded hover:bg-red-50 transition"
                            title="Delete doctor"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
            {doctor.bio && (
                <p className="text-xs text-gray-400 mt-2 italic">{doctor.bio}</p>
            )}
        </div>
    );
}

export default DoctorCard;