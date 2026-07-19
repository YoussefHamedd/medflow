import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { toast } from '../toast.jsx';
import { Breadcrumbs } from '../components/Layout.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import Avatar from '../components/Avatar.jsx';
import { PlusIcon, EyeIcon, DownloadIcon, EditIcon, TrashIcon, ChevronDown } from '../icons.jsx';

const fmtDate = (iso) =>
  new Date(iso + 'Z').toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });

function RecordForm({ record, doctors, onClose, onSaved }) {
  const [title, setTitle] = useState(record?.title || '');
  const [description, setDescription] = useState(record?.description || '');
  const [file, setFile] = useState(null);
  const [chosen, setChosen] = useState(record?.doctors?.map((d) => d.id) || []);
  const [pickOpen, setPickOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('doctorIds', JSON.stringify(chosen));
      if (file) fd.append('file', file);
      if (record) {
        await api(`/records/${record.id}`, { method: 'PUT', formData: fd });
        toast('Medical record has been updated.');
      } else {
        await api('/records', { method: 'POST', formData: fd });
        toast('New medical record has been added.');
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={record ? 'Edit Medical Record' : 'Add Medical Record'} onClose={onClose}>
      <div className="field">
        <label>File Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="file 1" />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add some infos here..." />
      </div>
      <div className="field">
        <label>Upload</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0] || null)} />
      </div>
      <div className="field">
        <label>Choose doctors</label>
        <div className="multi-select">
          {chosen.map((id) => {
            const d = doctors.find((x) => x.id === id);
            if (!d) return null;
            return (
              <span className="tag" key={id}>
                {d.first_name} {d.last_name}
                <button onClick={() => setChosen((c) => c.filter((x) => x !== id))}>✕</button>
              </span>
            );
          })}
          <button
            className="icon-btn"
            style={{ marginLeft: 'auto' }}
            onClick={() => setPickOpen((o) => !o)}
          >
            <ChevronDown size={15} />
          </button>
          {pickOpen && (
            <div className="dropdown-menu" style={{ top: '100%', left: 0, right: 'auto', width: '100%' }}>
              {doctors.filter((d) => !chosen.includes(d.id)).map((d) => (
                <button key={d.id} className="item" onClick={() => { setChosen((c) => [...c, d.id]); setPickOpen(false); }}>
                  {d.first_name} {d.last_name} — {d.specialty}
                </button>
              ))}
              {doctors.filter((d) => !chosen.includes(d.id)).length === 0 && (
                <div style={{ padding: 8, color: 'var(--text-faint)', fontSize: 13 }}>No more doctors</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" disabled={busy || !title} onClick={submit}>Submit</button>
      </div>
    </Modal>
  );
}

export default function Records({ role }) {
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | record
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = () => api('/records').then(setRecords).catch(() => {});
  useEffect(() => {
    load();
    api('/doctors').then(setDoctors).catch(() => {});
  }, []);

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    {
      key: 'assigned', label: 'Assigned To',
      render: (r) => (
        <div style={{ display: 'flex' }}>
          {r.doctors?.map((d) => (
            <div key={d.id} style={{ marginLeft: -6 }} title={`${d.first_name} ${d.last_name}`}>
              <Avatar user={d} size={30} />
            </div>
          ))}
        </div>
      ),
    },
    { key: 'created_at', label: 'Created', render: (r) => fmtDate(r.created_at) },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="row-action-btns">
          {r.file_path && (
            <button className="sq-btn view" title="View" onClick={() => setViewing(r)}>
              <EyeIcon size={16} />
            </button>
          )}
          {r.file_path && (
            <a className="sq-btn download" title="Download" href={r.file_path} download={r.file_name}>
              <DownloadIcon size={15} />
            </a>
          )}
          {role === 'patient' && (
            <button className="sq-btn edit" title="Edit" onClick={() => setEditing(r)}>
              <EditIcon size={15} />
            </button>
          )}
          {role === 'patient' && (
            <button className="sq-btn delete" title="Delete" onClick={() => setDeleting(r)}>
              <TrashIcon size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumbs page="Medical Records" />
      <DataTable
        columns={columns}
        rows={records}
        countLabel="users"
        searchPlaceholder="Search by name..."
        searchFn={(r, q) => (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)}
        actions={
          role === 'patient' ? (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              Add New <PlusIcon size={15} />
            </button>
          ) : null
        }
        emptyText="No medical records yet."
      />

      {editing && (
        <RecordForm
          record={editing === 'new' ? null : editing}
          doctors={doctors}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Record"
          message="Are you sure? You can't undo this action afterwards."
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await api(`/records/${deleting.id}`, { method: 'DELETE' });
            toast('Medical record has been deleted.');
            setDeleting(null);
            load();
          }}
        />
      )}

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)} width={560}>
          <div style={{ color: 'var(--text-soft)', marginBottom: 12 }}>{viewing.description}</div>
          {/\.(png|jpe?g|gif|webp)$/i.test(viewing.file_name || '') ? (
            <img src={viewing.file_path} alt={viewing.file_name} style={{ maxWidth: '100%', borderRadius: 8 }} />
          ) : (
            <a href={viewing.file_path} target="_blank" rel="noreferrer">{viewing.file_name || 'Open file'}</a>
          )}
        </Modal>
      )}
    </div>
  );
}
