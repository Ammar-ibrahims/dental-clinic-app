import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import AddDoctor from './pages/AddDoctor';
import EditDoctor from './pages/EditDoctor';
import Patients from './pages/Patients';
import AddPatient from './pages/AddPatient';
import EditPatient from './pages/EditPatient';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import EditAppointment from './pages/EditAppointment';
import AdminAppointments from './pages/AdminAppointments';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-black text-blue-600">🦷 DENTAL APP</h1>
          <div className="space-x-6 font-bold text-gray-600">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <Link to="/patients" className="hover:text-blue-600">Patients</Link>
            <Link to="/doctors" className="hover:text-blue-600">Doctors</Link>
            <Link to="/appointments" className="hover:text-blue-600">Appointments</Link>
            <Link to="/admin/appointments" className="hover:text-blue-600 text-purple-600">Admin</Link>
          </div>
        </nav>

        {/* Page Content */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/new" element={<AddPatient />} />
          <Route path="/patients/:id/edit" element={<EditPatient />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/new" element={<AddDoctor />} />
          <Route path="/doctors/:id/edit" element={<EditDoctor />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/new" element={<BookAppointment />} />
          <Route path="/appointments/:id/edit" element={<EditAppointment />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;