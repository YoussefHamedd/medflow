import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Breadcrumbs } from '../../components/Layout.jsx';
import DataTable from '../../components/DataTable.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import RowMenu from '../../components/RowMenu.jsx';
import Avatar from '../../components/Avatar.jsx';
import Modal, { ConfirmDialog } from '../../components/Modal.jsx';
import { PlusIcon } from '../../icons.jsx';

function AddAdminModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'super' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/admins', { method: 'POST', body: form });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Administrator" onClose={onClose}>
      <div className="field"><label>Name</label><input value={form.name} onChange={set('name')} /></div>
      <div className="field"><label>Email address</label><input type="email" value={form.email} onChange={set('email')} /></div>
      <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
      <div className="field">
        <label>Role</label>
        <div className="radio-row">
          <label><input type="radio" checked={form.role === 'super'} onChange={() => setForm((f) => ({ ...f, role: 'super' }))} /> Super</label>
          <label><input type="radio" checked={form.role === 'moderator'} onChange={() => setForm((f) => ({ ...f, role: 'moderator' }))} /> Moderator</label>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn btn-ghost" disabled={busy || !form.name || !form.email} onClick={submit}>Submit</button>
      </div>
    </Modal>
  );
}

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => api('/admins').then(setAdmins).catch(() => {});
  useEffect(() => { load(); }, []);

  const rows = roleFilter ? admins.filter((a) => a.admin_role === roleFilter) : admins;

  const columns = [
    {
      key: 'name', label: 'Name',
      sortValue: (a) => `${a.first_name} ${a.last_name}`.toLowerCase(),
      render: (a) => (
        <div className="cell-user">
          <Avatar user={a} size={34} />
          <div>
            <div>{a.first_name} {a.last_name}</div>
            <div className="sub">{a.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (a) => <span className={`chip ${a.admin_role}`}>{a.admin_role}</span> },
    { key: 'email', label: 'Email' },
    {
      key: 'actions', label: 'Actions',
      render: (a) => (
        <RowMenu items={[{ label: 'Delete', danger: true, onClick: () => setDeleting(a) }]} />
      ),
    },
  ];

  return (
    <div>
      <Breadcrumbs page="Admins" />
      <DataTable
        columns={columns}
        rows={rows}
        countLabel="users"
        searchFn={(a, q) => `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q)}
        filters={
          <Dropdown label={roleFilter ? `Roles: ${roleFilter}` : 'Roles'}>
            <button className="item" onClick={() => setRoleFilter('')}>All</button>
            <button className="item" onClick={() => setRoleFilter('super')}><span className="chip super">super</span></button>
            <button className="item" onClick={() => setRoleFilter('moderator')}><span className="chip moderator">moderator</span></button>
          </Dropdown>
        }
        actions={
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            Add New <PlusIcon size={15} />
          </button>
        }
        emptyText="No admins."
      />
      {adding && <AddAdminModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
      {deleting && (
        <ConfirmDialog
          title="Delete Admin"
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
