import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Breadcrumbs } from '../components/Layout.jsx';
import { toast } from '../toast.jsx';
import { PersonIcon, ClockIcon, EditIcon } from '../icons.jsx';

const LockIcon = (p) => (
  <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const ShieldIcon = (p) => (
  <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </svg>
);
const BadgeIcon = (p) => (
  <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="6" width="18" height="14" rx="2" /><path d="M9 6V4h6v2M8 12h8M8 16h5" />
  </svg>
);
const Chevron = ({ open }) => (
  <svg className={`chev${open ? ' open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

function Accordion({ icon, title, open, onToggle, children }) {
  return (
    <div className="acc-card">
      <button className="acc-head" onClick={onToggle}>
        {icon} {title} <Chevron open={open} />
      </button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', textarea, children }) {
  return (
    <div className="float-field">
      <label>{label}</label>
      {children ? children : textarea ? (
        <textarea value={value} onChange={onChange} rows={4} />
      ) : (
        <input type={type} value={value} onChange={onChange} />
      )}
    </div>
  );
}

function TagsEditor({ items, setItems, placeholder, onSave }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (!v) return;
    setItems([...items, v]);
    setText('');
  };
  return (
    <div>
      <div>
        {items.map((s, i) => (
          <span className="gray-tag" key={`${s}-${i}`}>
            {s}
            <button onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
          </span>
        ))}
      </div>
      <div className="tag-input-row">
        <input value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="add-btn" onClick={add}>Add</button>
      </div>
      <button className="save-btn" onClick={onSave}>Save</button>
    </div>
  );
}

const DAY_ORDER = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'monday', 'sunday'];

export default function Settings({ role }) {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [hours, setHours] = useState([]);
  const [services, setServices] = useState([]);
  const [quals, setQuals] = useState([]);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [open, setOpen] = useState({ general: true });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.first_name, lastName: user.last_name, email: user.email,
        phone: user.phone || '', address: user.address || '', description: user.description || '',
        gender: user.gender || '', specialty: user.specialty || '',
      });
      setServices((user.services || '').split(',').filter(Boolean).map((s) => s.trim()));
      setQuals((user.qualifications || '').split(',').filter(Boolean).map((s) => s.trim()));
      if (role === 'doctor') api(`/working-hours/${user.id}`).then(setHours).catch(() => {});
    }
  }, [user?.id, role]);

  if (!form) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setHour = (day, field, value) =>
    setHours((h) => h.map((x) => (x.day === day ? { ...x, [field]: value } : x)));
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const saveProfile = async (extra = {}) => {
    const fd = new FormData();
    Object.entries({ ...form, ...extra }).forEach(([k, v]) => fd.append(k, v));
    fd.append('services', extra.services ?? services.join(','));
    fd.append('qualifications', extra.qualifications ?? quals.join(','));
    if (avatarFile) fd.append('avatar', avatarFile);
    const updated = await api('/me', { method: 'PUT', formData: fd });
    setUser(updated);
    toast('Your profile has been updated.');
  };

  const savePassword = async () => {
    try {
      await api('/me/password', { method: 'PUT', body: pw });
      setPw({ currentPassword: '', newPassword: '' });
      toast('Your password has been changed.');
    } catch (e) {
      toast(e.message, 'Error.');
    }
  };

  const saveHours = async () => {
    await api(`/working-hours/${user.id}`, { method: 'PUT', body: { hours } });
    toast('Working hours have been updated.');
  };

  const sortedHours = [...hours].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  return (
    <div>
      <Breadcrumbs root="Settings" page="Manage Profile" />

      <Accordion icon={<PersonIcon size={15} />} title="General Infos" open={!!open.general} onToggle={() => toggle('general')}>
        <div className="settings-grid">
          <div>
            <div className="profile-photo">
              {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} alt="" />
              ) : user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <svg width="120" height="120" viewBox="0 0 40 40">
                  <circle cx="20" cy="14" r="8" fill="#8b9390" />
                  <path d="M3 40c2-10 8.5-15 17-15s15 5 17 15" fill="#8b9390" />
                </svg>
              )}
            </div>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0] || null)} style={{ fontSize: 12, marginBottom: 12, width: 180 }} />
            <button className="btn btn-danger btn-block" style={{ marginBottom: 10 }} onClick={() => setAvatarFile(null)}>Cancel</button>
            <button className="btn btn-info btn-block" onClick={() => saveProfile()}>Update</button>
          </div>
          <div>
            <Field label="First Name" value={form.firstName} onChange={set('firstName')} />
            <Field label="Last Name" value={form.lastName} onChange={set('lastName')} />
            <Field label="Email" value={form.email} onChange={set('email')} />
            <Field label="Phone" value={form.phone} onChange={set('phone')} />
            {role === 'doctor' && (
              <>
                <Field label="Address" value={form.address} onChange={set('address')} />
                <Field label="Description" value={form.description} onChange={set('description')} textarea />
                <Field label="Gender">
                  <select value={form.gender} onChange={set('gender')}>
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </Field>
                <Field label="Speciality">
                  <select value={form.specialty} onChange={set('specialty')}>
                    {['therapist', 'cardiologist', 'dermatologist', 'dentist', 'generalist', 'pediatrician'].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            <button className="save-btn" onClick={() => saveProfile()}>Save</button>
          </div>
        </div>
      </Accordion>

      <Accordion icon={<LockIcon size={15} />} title="Password" open={!!open.password} onToggle={() => toggle('password')}>
        <Field label="Current Password" type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
        <Field label="New Password" type="password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
        <button className="save-btn" onClick={savePassword}>Save</button>
      </Accordion>

      {role === 'doctor' && (
        <>
          <Accordion icon={<ShieldIcon size={15} />} title="Services" open={!!open.services} onToggle={() => toggle('services')}>
            <TagsEditor
              items={services}
              setItems={setServices}
              placeholder="Add a new service"
              onSave={() => saveProfile({ services: services.join(',') })}
            />
          </Accordion>

          <Accordion icon={<BadgeIcon size={15} />} title="Qualifications" open={!!open.quals} onToggle={() => toggle('quals')}>
            <TagsEditor
              items={quals}
              setItems={setQuals}
              placeholder="Add a new qualification"
              onSave={() => saveProfile({ qualifications: quals.join(',') })}
            />
          </Accordion>

          <Accordion icon={<ClockIcon size={15} />} title="Working Hours" open={!!open.hours} onToggle={() => toggle('hours')}>
            <div className="hours-grid">
              {sortedHours.map((h) => (
                <HoursRow key={h.day} h={h} setHour={setHour} />
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="save-btn" onClick={saveHours}>Save</button>
            </div>
          </Accordion>
        </>
      )}
    </div>
  );
}

function HoursRow({ h, setHour }) {
  return (
    <>
      <div className="hours-field">
        <label>{h.day} (Start Time)</label>
        <input type="time" value={h.start_time} onChange={(e) => setHour(h.day, 'start_time', e.target.value)} />
      </div>
      <div className="hours-field">
        <label>{h.day} (End Time)</label>
        <input type="time" value={h.end_time} onChange={(e) => setHour(h.day, 'end_time', e.target.value)} />
      </div>
      <button className="sq-btn edit" title="Edit"><EditIcon size={15} /></button>
    </>
  );
}
