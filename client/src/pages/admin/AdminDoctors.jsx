import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Breadcrumbs } from '../../components/Layout.jsx';
import DataTable from '../../components/DataTable.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import RowMenu from '../../components/RowMenu.jsx';
import Avatar from '../../components/Avatar.jsx';
import Modal, { ConfirmDialog } from '../../components/Modal.jsx';
import { PlusIcon } from '../../icons.jsx';

function AddDoctorModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', gender: '', specialty: 'therapist', phone: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/doctors', { method: 'POST', body: form });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Doctor" onClose={onClose}>
      <div className="form-grid-2">
        <div className="field"><label>First Name</label><input value={form.firstName} onChange={set('firstName')} /></div>
        <div className="field"><label>Last Name</label><input value={form.lastName} onChange={set('lastName')} /></div>
      </div>
      <div className="field"><label>Email address</label><input type="email" value={form.email} onChange={set('email')} /></div>
      <div className="field"><label>Password</label><input type="password" value={form.password} onChange={set('password')} placeholder="Default: password123" /></div>
      <div className="field">
        <label>Gender</label>
        <select value={form.gender} onChange={set('gender')}>
          <option value="">Select</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
      </div>
      <div className="field">
        <label>Speciality</label>
        <select value={form.specialty} onChange={set('specialty')}>
          {['therapist', 'cardiologist', 'dermatologist', 'dentist', 'generalist', 'pediatrician'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn btn-ghost" disabled={busy || !form.firstName || !form.email} onClick={submit}>Submit</button>
      </div>
    </Modal>
  );
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [gender, setGender] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => api(`/doctors?gender=${gender}`).then(setDoctors).catch(() => {});
  useEffect(() => { load(); }, [gender]);

  const columns = [
    {
      key: 'name', label: 'Name',
      sortValue: (d) => `${d.first_name} ${d.last_name}`.toLowerCase(),
      render: (d) => (
        <div className="cell-user">
          <Avatar user={d} size={34} />
          <div>
            <div>{d.first_name} {d.last_name}</div>
            <div className="sub">{d.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'specialty', label: 'Specialty' },
    { key: 'email', label: 'Email' },
    {
      key: 'actions', label: 'Actions',
      render: (d) => (
        <RowMenu items={[{ label: 'Delete', danger: true, onClick: () => setDeleting(d) }]} />
      ),
    },
  ];

  return (
    <div>
      <Breadcrumbs page="Doctors" />
      <DataTable
        columns={columns}
        rows={doctors}
        countLabel="users"
        searchFn={(d, q) => `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q)}
        filters={
          <Dropdown label={gender ? `Gender: ${gender}` : 'Gender'}>
            <button className="item" onClick={() => setGender('')}>All</button>
            <button className="item" onClick={() => setGender('female')}>Female</button>
            <button className="item" onClick={() => setGender('male')}>Male</button>
          </Dropdown>
        }
        actions={
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            Add New <PlusIcon size={15} />
          </button>
        }
        emptyText="No doctors."
      />
      {adding && <AddDoctorModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
      {deleting && (
        <ConfirmDialog
          title="Delete Doctor"
          message={`Delete ${deleting.first_name} ${deleting.last_name}? You can't undo this action afterwards.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await api(`/users/${deleting.id}`, { method: 'DELETE' });
            setDeleting(null);
            load();
          }}
        />
      )}
    </div>
  );
}
