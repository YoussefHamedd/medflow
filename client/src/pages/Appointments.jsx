import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Breadcrumbs } from '../components/Layout.jsx';
import DataTable from '../components/DataTable.jsx';
import Dropdown from '../components/Dropdown.jsx';
import RowMenu from '../components/RowMenu.jsx';
import Avatar from '../components/Avatar.jsx';
import { ConfirmDialog } from '../components/Modal.jsx';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).replace(',', ',');

export default function Appointments({ role }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [popup, setPopup] = useState(null); // {appt, x, y}
  const [view, setView] = useState('month'); // month | week | day | list (calendar) — doctors default to calendar+table stacked
  const calRef = useRef(null);
  const [calTitle, setCalTitle] = useState('');

  const load = () => api('/appointments').then(setAppointments).catch(() => {});
  useEffect(() => { load(); }, []);

  const rows = useMemo(
    () => (statusFilter ? appointments.filter((a) => a.status === statusFilter) : appointments),
    [appointments, statusFilter]
  );

  const otherName = (a) =>
    role === 'doctor'
      ? { name: `${a.patient_first} ${a.patient_last}`, sub: a.patient_gender, user: { first_name: a.patient_first, last_name: a.patient_last, avatar: a.patient_avatar } }
      : { name: `${a.doctor_first} ${a.doctor_last}`, sub: a.doctor_specialty, user: { first_name: a.doctor_first, last_name: a.doctor_last, avatar: a.doctor_avatar } };

  const setStatus = async (a, status) => {
    await api(`/appointments/${a.id}`, { method: 'PUT', body: { status } });
    setPopup(null);
    load();
  };

  const columns = [
    {
      key: 'who',
      label: role === 'doctor' ? 'Patient' : 'Doctor',
      sortValue: (a) => otherName(a).name.toLowerCase(),
      render: (a) => {
        const o = otherName(a);
        return (
          <div className="cell-user">
            <Avatar user={o.user} size={34} />
            <div>
              <div>{o.name}</div>
              <div className="sub">{o.sub}</div>
            </div>
          </div>
        );
      },
    },
    { key: 'title', label: 'Title' },
    { key: 'date', label: 'Date', sortValue: (a) => a.date, render: (a) => fmtDate(a.date) },
    {
      key: 'status', label: 'Status',
      render: (a) => <span className={`chip ${a.status}`}>{a.status}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (a) => (
        <RowMenu
          items={[
            ...(role === 'doctor'
              ? [
                  { label: 'Confirm', onClick: () => setStatus(a, 'confirmed') },
                  { label: 'Complete', onClick: () => setStatus(a, 'completed') },
                ]
              : []),
            { label: 'Cancel appointment', onClick: () => setStatus(a, 'cancelled') },
            { label: 'Delete', danger: true, onClick: () => setDeleting(a) },
          ]}
        />
      ),
    },
  ];

  const events = appointments.map((a) => ({
    id: String(a.id),
    title: `${a.title} - ${otherName(a).name}`,
    start: a.date,
    end: new Date(new Date(a.date).getTime() + 30 * 60000).toISOString(),
    className: `event-${a.status}`,
    extendedProps: { appt: a },
  }));

  const changeView = (v) => {
    setView(v);
    const calView = { month: 'dayGridMonth', week: 'timeGridWeek', day: 'timeGridDay', list: 'listWeek' }[v];
    calRef.current?.getApi().changeView(calView);
  };

  const showCalendar = role === 'doctor';

  return (
    <div>
      <Breadcrumbs page="Appointments" />

      {showCalendar && (
        <div style={{ marginBottom: 26 }}>
          <div className="cal-header">
            <h2>{calTitle}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="seg dark">
                <button className="cal-btn" onClick={() => calRef.current?.getApi().today()}>today</button>
              </div>
              <div className="seg dark">
                <button className="cal-btn" onClick={() => calRef.current?.getApi().prev()}>‹</button>
                <button className="cal-btn" onClick={() => calRef.current?.getApi().next()}>›</button>
              </div>
              <div className="seg dark">
                {['month', 'week', 'day', 'list'].map((v) => (
                  <button key={v} className={`cal-btn${view === v ? ' on' : ''}`} onClick={() => changeView(v)}>{v}</button>
                ))}
              </div>
            </div>
          </div>
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            height={480}
            firstDay={1}
            weekends={false}
            events={events}
            datesSet={(info) => setCalTitle(info.view.title)}
            eventClick={(info) => {
              info.jsEvent.preventDefault();
              setPopup({
                appt: info.event.extendedProps.appt,
                x: Math.min(info.jsEvent.clientX, window.innerWidth - 360),
                y: Math.min(info.jsEvent.clientY, window.innerHeight - 320),
              });
            }}
          />
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        countLabel="appointments"
        searchPlaceholder={role === 'doctor' ? 'Search by patient name, title or date...' : 'Search by doctor name, title, speciality or date...'}
        searchFn={(a, q) =>
          otherName(a).name.toLowerCase().includes(q) ||
          (a.title || '').toLowerCase().includes(q) ||
          (a.date || '').toLowerCase().includes(q)
        }
        filters={
          <Dropdown label={statusFilter ? `Status: ${statusFilter}` : 'Status'}>
            <button className="item" onClick={() => setStatusFilter('')}>All</button>
            {STATUSES.map((s) => (
              <button key={s} className="item" onClick={() => setStatusFilter(s)}>
                <span className={`chip ${s}`}>{s}</span>
              </button>
            ))}
          </Dropdown>
        }
        emptyText="No appointments yet."
      />

      {popup && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 80 }} onClick={() => setPopup(null)} />
          <div className="event-pop" style={{ left: popup.x, top: popup.y }}>
            <h4>
              {popup.appt.title} - {otherName(popup.appt).name}
              <button className="close" style={{ background: 'none', border: 'none', color: 'var(--text-soft)' }} onClick={() => setPopup(null)}>✕</button>
            </h4>
            <div className="lbl">DESCRIPTION</div>
            <div className="val">{popup.appt.description || '—'}</div>
            <div className="lbl">STATUS</div>
            <div className="val">
              <span className="status-word" style={{
                color: { pending: '#d3c928', confirmed: '#35a866', cancelled: '#d9407a', completed: '#2b7cc0' }[popup.appt.status],
              }}>{popup.appt.status}</span>
            </div>
            <div className="lbl">DATE</div>
            <div className="val">{popup.appt.date}</div>
            {role === 'doctor' && (
              <div className="actions">
                {popup.appt.status === 'confirmed' ? (
                  <button className="pill-btn confirm" onClick={() => setStatus(popup.appt, 'completed')}>Mark Appointment As Completed</button>
                ) : (
                  <button className="pill-btn confirm" onClick={() => setStatus(popup.appt, 'confirmed')}>Confirm Appointment</button>
                )}
                <button className="pill-btn cancel" onClick={() => setStatus(popup.appt, 'cancelled')}>Cancel Appointment</button>
              </div>
            )}
          </div>
        </>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Appointment"
          message="Are you sure? You can't undo this action afterwards."
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await api(`/appointments/${deleting.id}`, { method: 'DELETE' });
            setDeleting(null);
            load();
          }}
        />
      )}
    </div>
  );
}
