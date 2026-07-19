import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, homeFor } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Join from './pages/Join.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Appointments from './pages/Appointments.jsx';
import Records from './pages/Records.jsx';
import Doctors from './pages/Doctors.jsx';
import Messages from './pages/Messages.jsx';
import AiDoctor from './pages/AiDoctor.jsx';
import Settings from './pages/Settings.jsx';
import Patients from './pages/Patients.jsx';
import Admins from './pages/admin/Admins.jsx';
import AdminDoctors from './pages/admin/AdminDoctors.jsx';
import {
  HomeIcon, ClockIcon, FileIcon, BriefcaseIcon, ChatIcon, BotIcon, UsersIcon,
} from './icons.jsx';

const PATIENT_NAV = [
  { to: '/patient', label: 'Home', icon: HomeIcon, end: true },
  { to: '/patient/appointments', label: 'Appointments', icon: ClockIcon },
  { to: '/patient/records', label: 'Medical Records', icon: FileIcon },
  { to: '/patient/doctors', label: 'Doctors', icon: BriefcaseIcon },
  { to: '/patient/messages', label: 'Messages', icon: ChatIcon },
  { to: '/patient/ai-doctor', label: 'AI Doctor', icon: BotIcon },
];

const DOCTOR_NAV = [
  { to: '/doctor', label: 'Home', icon: HomeIcon, end: true },
  { to: '/doctor/appointments', label: 'Appointments', icon: ClockIcon },
  { to: '/doctor/patients', label: 'Patients', icon: UsersIcon },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Admins', icon: HomeIcon, end: true },
  { to: '/admin/patients', label: 'Patients', icon: FileIcon },
  { to: '/admin/doctors', label: 'Doctors', icon: BriefcaseIcon },
];

const SETTINGS_PATH = { patient: '/patient/settings', doctor: '/doctor/settings', admin: null };

function Protected({ role, nav, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return <Layout nav={nav} settingsPath={SETTINGS_PATH[role]}>{children}</Layout>;
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/patient" element={<Protected role="patient" nav={PATIENT_NAV}><Dashboard role="patient" /></Protected>} />
          <Route path="/patient/appointments" element={<Protected role="patient" nav={PATIENT_NAV}><Appointments role="patient" /></Protected>} />
          <Route path="/patient/records" element={<Protected role="patient" nav={PATIENT_NAV}><Records role="patient" /></Protected>} />
          <Route path="/patient/doctors" element={<Protected role="patient" nav={PATIENT_NAV}><Doctors /></Protected>} />
          <Route path="/patient/messages" element={<Protected role="patient" nav={PATIENT_NAV}><Messages /></Protected>} />
          <Route path="/patient/ai-doctor" element={<Protected role="patient" nav={PATIENT_NAV}><AiDoctor /></Protected>} />
          <Route path="/patient/settings" element={<Protected role="patient" nav={PATIENT_NAV}><Settings role="patient" /></Protected>} />

          <Route path="/doctor" element={<Protected role="doctor" nav={DOCTOR_NAV}><Dashboard role="doctor" /></Protected>} />
          <Route path="/doctor/appointments" element={<Protected role="doctor" nav={DOCTOR_NAV}><Appointments role="doctor" /></Protected>} />
          <Route path="/doctor/patients" element={<Protected role="doctor" nav={DOCTOR_NAV}><Patients role="doctor" /></Protected>} />
          <Route path="/doctor/messages" element={<Protected role="doctor" nav={DOCTOR_NAV}><Messages /></Protected>} />
          <Route path="/doctor/settings" element={<Protected role="doctor" nav={DOCTOR_NAV}><Settings role="doctor" /></Protected>} />

          <Route path="/admin" element={<Protected role="admin" nav={ADMIN_NAV}><Admins /></Protected>} />
          <Route path="/admin/patients" element={<Protected role="admin" nav={ADMIN_NAV}><Patients role="admin" /></Protected>} />
          <Route path="/admin/doctors" element={<Protected role="admin" nav={ADMIN_NAV}><AdminDoctors /></Protected>} />

          <Route path="*" element={<Root />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
