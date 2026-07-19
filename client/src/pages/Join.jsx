import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoonIcon } from '../icons.jsx';

function PatientMiniIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#57c690" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="8" r="3" />
      <path d="M4 20c0-3.5 2.7-6 6-6 1.4 0 2.7.4 3.7 1.2" />
      <path d="M16 13l1.2 1.2L20 11" />
      <path d="M15 19h6" />
    </svg>
  );
}
function DoctorMiniIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#57c690" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="7" r="3" />
      <path d="M6 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <path d="M12 14v3" />
      <circle cx="12" cy="19" r="1.4" />
    </svg>
  );
}

export default function Join() {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');

  return (
    <div className="shell" style={{ display: 'block' }}>
      <div className="join-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1>Join as a Patient or Doctor</h1>
          <MoonIcon size={16} style={{ color: 'var(--text-soft)' }} />
        </div>
        <div className="join-cards">
          <button className={`join-card${role === 'patient' ? ' selected' : ''}`} onClick={() => setRole('patient')}>
            <span className="radio" />
            Im a patient, and I ready to recover
            <div className="mini-icon"><PatientMiniIcon /></div>
          </button>
          <button className={`join-card${role === 'doctor' ? ' selected' : ''}`} onClick={() => setRole('doctor')}>
            <span className="radio" />
            Im a doctor, and i will do my best to heal patients.
            <div className="mini-icon"><DoctorMiniIcon /></div>
          </button>
        </div>
        <button className="join-submit" onClick={() => navigate(`/signup?role=${role}`)}>Create Account</button>
      </div>
    </div>
  );
}
