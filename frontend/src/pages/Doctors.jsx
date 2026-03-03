import { doctors } from '../mockData';
import DoctorCard from '../components/DoctorCard';

function Doctors() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Our Doctors</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {doctors.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
            </div>
        </div>
    );
}
export default Doctors;