import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import Dropdown from '../components/Dropdown.jsx';
import Modal from '../components/Modal.jsx';
import Avatar from '../components/Avatar.jsx';
import { toast } from '../toast.jsx';
import { SearchIcon, ChatIcon } from '../icons.jsx';

function DoctorPhoto({ doctor }) {
  if (doctor.avatar) {
    return <img src={doctor.avatar} alt="" />;
  }
  // gray silhouette placeholder, like the reference app
  return (
    <svg width="130" height="130" viewBox="0 0 40 40">
      <circle cx="20" cy="14" r="8" fill="#9aa19e" />
      <path d="M3 40c2-10 8.5-15 17-15s15 5 17 15" fill="#9aa19e" />
    </svg>
  );
}

function BookModal({ doctor, onClose, onBooked }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/appointments', {
        method: 'POST',
        body: { doctorId: doctor.id, title, description, date: new Date(`${day}T${time || '09:00'}`).toISOString() },
      });
      onBooked();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Book your appointment now !" onClose={onClose}>
      <div className="float-field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter your appointment title" />
      </div>
      <div className="float-field">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us more about your appointment" />
      </div>
      <div className="float-field">
        <label>Appointment Day</label>
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      <div className="float-field">
        <label>Appointment Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-ghost" style={{ fontWeight: 700 }} disabled={busy || !title || !day} onClick={submit}>Submit</button>
      </div>
    </Modal>
  );
}

function InfoModal({ doctor, onClose }) {
  const [hours, setHours] = useState([]);
  useEffect(() => {
    api(`/working-hours/${doctor.id}`).then(setHours).catch(() => {});
  }, [doctor.id]);
  return (
    <Modal title={`${doctor.first_name} ${doctor.last_name}`} onClose={onClose} width={460}>
      <div style={{ color: 'var(--primary-bright)', marginBottom: 10 }}>{doctor.specialty}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-soft)', marginBottom: 14 }}>{doctor.description || 'No description yet.'}</div>
      <div style={{ fontSize: 13, marginBottom: 6 }}><b>Email:</b> {doctor.email}</div>
      {doctor.phone && <div style={{ fontSize: 13, marginBottom: 14 }}><b>Phone:</b> {doctor.phone}</div>}
      {hours.length > 0 && (
        <>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Working hours</div>
          {hours.map((h) => (
            <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: 'var(--text-soft)' }}>
              <span style={{ textTransform: 'capitalize' }}>{h.day}</span>
              <span>{h.start_time} — {h.end_time}</span>
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}

export default function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [booking, setBooking] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/doctors?search=${encodeURIComponent(search)}&gender=${gender}`).then(setDoctors).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [search, gender]);

  return (
    <div>
      <div className="doctor-toolbar">
        <div style={{ flex: 1 }}>
          <div className="search-label">Search</div>
          <div className="search-box">
            <SearchIcon size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctors..." />
          </div>
        </div>
        <Dropdown label={gender ? `Gender: ${gender}` : 'Gender'}>
          <button className="item" onClick={() => setGender('')}>All</button>
          <button className="item" onClick={() => setGender('female')}>Female</button>
          <button className="item" onClick={() => setGender('male')}>Male</button>
        </Dropdown>
      </div>

      <div className="doctor-grid">
        {doctors.map((d) => (
          <div className="doctor-card" key={d.id}>
            <div className="photo"><DoctorPhoto doctor={d} /></div>
            <h4>{d.first_name} {d.last_name}</h4>
            <div className="spec">{d.specialty || '—'}</div>
            <div className="services">
              {(d.services || '').split(',').filter(Boolean).map((s) => (
                <span className="service" key={s}>{s.trim()}</span>
              ))}
            </div>
            <div className="card-actions">
              <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => setBooking(d)}>Book</button>
              <button className="more" onClick={() => setInfo(d)}>More Infos</button>
              <button
                className="icon-btn"
                style={{ marginLeft: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}
                title="Message"
                onClick={() => navigate(`/patient/messages?with=${d.id}`)}
              >
                <ChatIcon size={16} />
              </button>
            </div>
          </div>
        ))}
        {doctors.length === 0 && <div className="empty-note">No doctors found.</div>}
      </div>

      {booking && (
        <BookModal
          doctor={booking}
          onClose={() => setBooking(null)}
          onBooked={() => { setBooking(null); toast('Your appointment has been booked, please wait for confirmation.'); }}
        />
      )}
      {info && <InfoModal doctor={info} onClose={() => setInfo(null)} />}
    </div>
  );
}
