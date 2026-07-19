import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import { MedkitSolid, PersonPlusSolid, DocPlusSolid, HandPlusSolid, ChatPlusSolid, ArrowRight, ChatIcon } from '../icons.jsx';

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso + 'Z').getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return `${Math.floor(s / 604800)} weeks ago`;
}

export default function Dashboard({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [upcoming, setUpcoming] = useState([]);
  const [convos, setConvos] = useState([]);

  useEffect(() => {
    api('/stats').then(setStats).catch(() => {});
    api('/upcoming').then(setUpcoming).catch(() => {});
    api('/conversations').then((c) => setConvos(c.filter((x) => x.lastMessage))).catch(() => {});
  }, []);

  const cards = role === 'doctor'
    ? [
        { label: 'Total Appointments', value: stats.appointments ?? 0, icon: <MedkitSolid size={34} /> },
        { label: 'Total Patients', value: stats.patients ?? 0, icon: <HandPlusSolid size={34} /> },
        { label: 'Total Guidance', value: stats.guidance ?? 0, icon: <ChatPlusSolid size={34} /> },
      ]
    : [
        { label: 'Total Appointments', value: stats.appointments ?? 0, icon: <MedkitSolid size={34} /> },
        { label: 'Total Doctors', value: stats.doctors ?? 0, icon: <PersonPlusSolid size={34} /> },
        { label: 'Total Records', value: stats.records ?? 0, icon: <DocPlusSolid size={34} /> },
      ];

  return (
    <div>
      <div className="stats-row">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div>
              <div className="label">{c.label}</div>
              <div className="value">{c.value}</div>
            </div>
            <div className="icon">{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div>
          <div className="section-title">Upcomming Visits</div>
          {upcoming.length === 0 && <div className="empty-note">No upcoming visits.</div>}
          {upcoming.map((v) => {
            const d = new Date(v.date);
            const other = role === 'doctor'
              ? `${v.patient_first} ${v.patient_last}`
              : `Dr. ${v.doctor_first} ${v.doctor_last}`;
            return (
              <div className="visit-card" key={v.id}>
                <div>
                  <div className="day">{String(d.getDate()).padStart(2, '0')}</div>
                  <div className="month">{MONTHS[d.getMonth()]}</div>
                </div>
                <div className="who">
                  <div className="name">{other}</div>
                  <div className="meta">
                    🗓 {String(d.getDate()).padStart(2, '0')}/{MONTHS[d.getMonth()]}/{d.getFullYear()}
                    &nbsp;&nbsp; STARTS AT {String(d.getHours()).padStart(2, '0')}H{String(d.getMinutes()).padStart(2, '0')}
                  </div>
                </div>
                <button className="visit-btn" onClick={() => navigate(`/${role}/appointments`)}>
                  View details <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="messages-panel">
          <h3>Recent Messages</h3>
          {convos.length === 0 && <div className="empty-note">No messages yet.</div>}
          {convos.slice(0, 3).map(({ user: other, lastMessage }) => (
            <div className="message-card" key={other.id}>
              <div className="head">
                <Avatar user={other} size={40} />
                <div>
                  <div className="name">{other.first_name} {other.last_name}</div>
                  <div className="time">{timeAgo(lastMessage.created_at)}</div>
                </div>
              </div>
              <div className="body">{lastMessage.text}</div>
              <div style={{ display: 'flex' }}>
                <button className="answer" onClick={() => navigate(`/${role}/messages?with=${other.id}`)}>
                  <ChatIcon size={14} /> Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
