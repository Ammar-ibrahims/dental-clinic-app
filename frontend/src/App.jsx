import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-black text-blue-600">🦷 DENTAL APP</h1>
          <div className="space-x-6 font-bold text-gray-600">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <Link to="/doctors" className="hover:text-blue-600">Doctors</Link>
            <Link to="/appointments" className="hover:text-blue-600">Appointments</Link>
          </div>
        </nav>

        {/* Page Content */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments/new" element={<BookAppointment />} />
          <Route path="/appointments" element={<Appointments />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;