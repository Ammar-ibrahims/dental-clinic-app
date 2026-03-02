import React, { useState, useEffect } from 'react';
import { Calendar, Users, Stethoscope } from 'lucide-react';

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Dental Clinic Management</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
          </div>
        </div>
        {/* Add more stat cards here */}
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-bottom border-gray-100">
          <h2 className="text-xl font-semibold">Recent Patients</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map(patient => (
              <tr key={patient.id}>
                <td className="px-6 py-4 font-medium">{patient.name}</td>
                <td className="px-6 py-4 text-gray-600">{patient.email}</td>
                <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
              </tr>
            ))}
            {patients.length === 0 && !loading && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-400">No patients found</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
