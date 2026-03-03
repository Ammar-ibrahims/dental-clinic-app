import { Link } from 'react-router-dom';

function PatientCard({ patient, onDelete }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-blue-600">{patient.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">📧 {patient.email}</p>
                    <p className="text-gray-600 text-sm">📞 {patient.phone}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        {patient.gender && <span>👤 {patient.gender}</span>}
                        {patient.blood_group && <span>🩸 {patient.blood_group}</span>}
                        {patient.date_of_birth && (
                            <span>🎂 {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link
                        to={`/patients/${patient.id}/edit`}
                        className="text-blue-400 hover:text-blue-600 text-sm font-bold px-2 py-1 rounded hover:bg-blue-50 transition"
                        title="Edit patient"
                    >
                        ✎
                    </Link>
                    <button
                        onClick={() => onDelete(patient.id)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1 rounded hover:bg-red-50 transition"
                        title="Delete patient"
                    >
                        ✕
                    </button>
                </div>
            </div>
            {patient.address && (
                <p className="text-xs text-gray-400 mt-2">📍 {patient.address}</p>
            )}
        </div>
    );
}

export default PatientCard;
