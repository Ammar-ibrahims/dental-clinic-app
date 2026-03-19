import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import AdminLayout from './layouts/AdminLayout';

// Shared / Public
import LandingPage from './pages/LandingPage';
import PatientLogin from './pages/PatientLogin';
import AdminLogin from './pages/AdminLogin';
import PatientRegister from './pages/PatientRegister';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import AddPatient from './pages/AddPatient';
import EditPatient from './pages/EditPatient';
import Doctors from './pages/Doctors';
import AddDoctor from './pages/AddDoctor';
import EditDoctor from './pages/EditDoctor';
import AdminAppointments from './pages/AdminAppointments';
import EditAppointment from './pages/EditAppointment';
import Reports from './pages/Reports';
import AIAnalysis from './pages/AIAnalysis';

// Patient Pages
import PatientDashboard from './pages/PatientDashboard';
import PatientAppointments from './pages/PatientAppointments';
import PatientProfile from './pages/PatientProfile';
import BookAppointment from './pages/BookAppointment';
import PatientAI from './pages/PatientAI';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/patient/register" element={<PatientRegister />} />

        {/* Patient Portal */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="appointments/new" element={<BookAppointment />} />
          <Route path="appointments/edit/:id" element={<BookAppointment isEdit={true} />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="ai-assistant" element={<PatientAI />} />
          <Route path="profile/edit/:id" element={<EditPatient isPatientPortal={true} />} />
        </Route>

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<AddPatient />} />
          <Route path="patients/edit/:id" element={<EditPatient />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/new" element={<AddDoctor />} />
          <Route path="doctors/edit/:id" element={<EditDoctor />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="appointments/edit/:id" element={<EditAppointment />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ai-analysis" element={<AIAnalysis />} />
          <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
        </Route>

        {/* Redirects */}
        <Route path="/appointments" element={<Navigate to="/patient/appointments" replace />} />
        <Route path="/patients" element={<Navigate to="/admin/patients" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;