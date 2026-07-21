import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Breadcrumbs } from '../components/Layout.jsx';
import DataTable from '../components/DataTable.jsx';
import Dropdown from '../components/Dropdown.jsx';
import RowMenu from '../components/RowMenu.jsx';
import Avatar from '../components/Avatar.jsx';
import { ConfirmDialog } from '../components/Modal.jsx';
import { KebabIcon, SearchIcon } from '../icons.jsx';

function PatientChip({ patient, onMessage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="patient-chip">
      <Avatar user={patient} size={38} />
      <div className="name">{patient.first_name} {patient.last_name}</div>
      <div ref={ref} style={{ position: 'relative' }}>
        <button className="kebab" onClick={() => setOpen((o) => !o)}>
          <KebabIcon size={15} />
        </button>
        {open && (
          <div className="dropdown-menu" style={{ right: 0 }} onClick={() => setOpen(false)}>
            <button className="item" onClick={onMessage}>Message</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Patients({ role }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [gender, setGender] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = () =>
    api(`/patients?gender=${gender}&search=${encodeURIComponent(search)}`).then(setPatients).catch(() => {});
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [gender, search]);

  if (role === 'doctor') {
    return (
      <div>
        <div className="doctor-toolbar">
          <div style={{ flex: 1 }}>
            <div className="search-label">Search</div>
            <div className="search-box">
              <SearchIcon size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="" />
            </div>
          </div>
          <Dropdown label={gender ? `Gender: ${gender}` : 'Gender'}>
            <button className="item" onClick={() => setGender('')}>All</button>
            <button className="item" onClick={() => setGender('female')}>Female</button>
            <button className="item" onClick={() => setGender('male')}>Male</button>
          </Dropdown>
        </div>
        <div className="patient-chip-grid">
          {patients.map((p) => (
            <PatientChip key={p.id} patient={p} onMessage={() => navigate(`/doctor/messages?with=${p.id}`)} />
          ))}
          {patients.length === 0 && <div className="empty-note" style={{ width: '100%' }}>No patients yet.</div>}
        </div>
      </div>
    );
  }

  // admin view: table
  const columns = [
    {
      key: 'name', label: 'Name',
      sortValue: (p) => `${p.first_name} ${p.last_name}`.toLowerCase(),
      render: (p) => (
        <div className="cell-user">
          <Avatar user={p} size={34} />
          <div>
            <div>{p.first_name} {p.last_name}</div>
            <div className="sub">{p.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'actions', label: 'Actions',
      render: (p) => (
        <RowMenu items={[{ label: 'Delete', danger: true, onClick: () => setDeleting(p) }]} />
      ),
    },
  ];

  return (
    <div>
      <Breadcrumbs page="Patients" />
      <DataTable
        columns={columns}
        rows={patients}
        countLabel="users"
        searchFn={(p, q) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)
        }
        filters={
          <Dropdown label={gender ? `Gender: ${gender}` : 'Gender'}>
            <button className="item" onClick={() => setGender('')}>All</button>
            <button className="item" onClick={() => setGender('female')}>Female</button>
            <button className="item" onClick={() => setGender('male')}>Male</button>
          </Dropdown>
        }
        emptyText="No patients yet."
      />
      {deleting && (
        <ConfirmDialog
          title="Delete Patient"
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
