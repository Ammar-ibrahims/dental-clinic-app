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
      {/* Task 1: Skip Link for Keyboard Users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white">
        Skip to main content
      </a>

      <div className="min-h-screen bg-gray-50">
        {/* --- RESPONSIVE HEADER --- */}
        <header role="banner" className="bg-white border-b sticky top-0 z-10 shadow-sm">
          {/* 
              Changed 'flex' to 'flex-col' (mobile) and 'md:flex-row' (desktop).
              Added 'gap-4' for spacing when stacked.
          */}
          <nav className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center gap-4" aria-label="Main Navigation">

            <h1 className="text-xl font-black text-blue-600 tracking-tight">
              <Link to="/" aria-label="Dental App Home">🦷 DENTAL APP</Link>
            </h1>

            {/* 
                Changed 'space-x-6' to 'flex-wrap' and 'justify-center'.
                This ensures links don't go off-screen on small phones.
                Added 'text-sm' for mobile and 'md:text-base' for desktop.
            */}
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-6 font-bold text-gray-600 list-none text-sm md:text-base">
              <li>
                <Link to="/" className="hover:text-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/patients" className="hover:text-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">
                  Patients
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">
                  Doctors
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 py-1">
                  Appointments
                </Link>
              </li>
              <li>
                <Link to="/admin/appointments" className="hover:text-purple-600 text-purple-500 transition focus:ring-2 focus:ring-purple-500 focus:outline-none rounded-md px-2 py-1">
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        {/* --- RESPONSIVE MAIN CONTENT --- */}
        <main id="main-content" role="main" className="focus:outline-none px-4 sm:px-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/new" element={<AddPatient />} />
            <Route path="/patients/edit/:id" element={<EditPatient />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/new" element={<AddDoctor />} />
            <Route path="/doctors/edit/:id" element={<EditDoctor />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/new" element={<BookAppointment />} />
            <Route path="/appointments/edit/:id" element={<EditAppointment />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
          </Routes>
        </main>

        <footer className="p-8 text-center text-gray-400 text-sm" role="contentinfo">
          &copy; {new Date().getFullYear()} Dental Clinic Management System. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;