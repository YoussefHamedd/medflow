import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import db, { seed } from './db.js';
import { notifyBooked, notifyStatusChange } from './mailer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const JWT_SECRET = process.env.JWT_SECRET || 'medflow-dev-secret';
const PORT = process.env.PORT || 4000;

seed();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.\-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ---------- helpers ----------
const publicUser = (u) => {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
};
const getUser = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });

// ---------- auth ----------
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, gender, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return res.status(409).json({ error: 'Email already registered' });
  const userRole = role === 'doctor' ? 'doctor' : 'patient';
  const info = db.prepare(`INSERT INTO users (role, first_name, last_name, gender, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(userRole, firstName, lastName, gender || '', email, bcrypt.hashSync(password, 10));
  if (userRole === 'doctor') {
    const wh = db.prepare('INSERT INTO working_hours (doctor_id, day, start_time, end_time) VALUES (?, ?, ?, ?)');
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) wh.run(info.lastInsertRowid, day, '09:00', '16:00');
  }
  const user = getUser(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (role && user.role !== role) return res.status(401).json({ error: `This account is not a ${role} account` });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json(publicUser(getUser(req.user.id))));

app.put('/api/me', auth, upload.single('avatar'), (req, res) => {
  const u = getUser(req.user.id);
  const b = req.body;
  const avatar = req.file ? `/uploads/${req.file.filename}` : u.avatar;
  db.prepare(`UPDATE users SET first_name=?, last_name=?, email=?, phone=?, address=?, description=?, gender=?, specialty=?, services=?, qualifications=?, avatar=? WHERE id=?`)
    .run(
      b.firstName ?? u.first_name, b.lastName ?? u.last_name, b.email ?? u.email,
      b.phone ?? u.phone, b.address ?? u.address, b.description ?? u.description,
      b.gender ?? u.gender, b.specialty ?? u.specialty, b.services ?? u.services,
      b.qualifications ?? u.qualifications, avatar, u.id
    );
  res.json(publicUser(getUser(req.user.id)));
});

app.put('/api/me/password', auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const u = getUser(req.user.id);
  if (!bcrypt.compareSync(currentPassword || '', u.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(newPassword, 10), u.id);
  res.json({ ok: true });
});

// ---------- stats / dashboard ----------
app.get('/api/stats', auth, (req, res) => {
  const { id, role } = req.user;
  if (role === 'patient') {
    res.json({
      appointments: db.prepare('SELECT COUNT(*) n FROM appointments WHERE patient_id=?').get(id).n,
      doctors: db.prepare(`SELECT COUNT(*) n FROM users WHERE role='doctor'`).get().n,
      records: db.prepare('SELECT COUNT(*) n FROM records WHERE patient_id=?').get(id).n,
    });
  } else if (role === 'doctor') {
    res.json({
      appointments: db.prepare('SELECT COUNT(*) n FROM appointments WHERE doctor_id=?').get(id).n,
      patients: db.prepare('SELECT COUNT(DISTINCT patient_id) n FROM appointments WHERE doctor_id=?').get(id).n,
      guidance: db.prepare('SELECT COUNT(*) n FROM messages WHERE receiver_id=?').get(id).n,
    });
  } else {
    res.json({
      admins: db.prepare(`SELECT COUNT(*) n FROM users WHERE role='admin'`).get().n,
      patients: db.prepare(`SELECT COUNT(*) n FROM users WHERE role='patient'`).get().n,
      doctors: db.prepare(`SELECT COUNT(*) n FROM users WHERE role='doctor'`).get().n,
    });
  }
});

app.get('/api/upcoming', auth, (req, res) => {
  const { id, role } = req.user;
  const col = role === 'doctor' ? 'doctor_id' : 'patient_id';
  const rows = db.prepare(`
    SELECT a.*, d.first_name AS doctor_first, d.last_name AS doctor_last, d.avatar AS doctor_avatar,
           p.first_name AS patient_first, p.last_name AS patient_last, p.avatar AS patient_avatar
    FROM appointments a
    JOIN users d ON d.id = a.doctor_id
    JOIN users p ON p.id = a.patient_id
    WHERE a.${col} = ? AND a.status IN ('pending','confirmed') AND datetime(a.date) >= datetime('now')
    ORDER BY a.date ASC LIMIT 5`).all(id);
  res.json(rows);
});

// ---------- doctors ----------
app.get('/api/doctors', auth, (req, res) => {
  const { search = '', gender = '' } = req.query;
  const rows = db.prepare(`
    SELECT * FROM users WHERE role='doctor'
    AND (first_name || ' ' || last_name LIKE ? OR email LIKE ?)
    AND (? = '' OR gender = ?)
    ORDER BY first_name COLLATE NOCASE`).all(`%${search}%`, `%${search}%`, gender, gender);
  res.json(rows.map(publicUser));
});

app.get('/api/doctors/:id', auth, (req, res) => {
  const d = db.prepare(`SELECT * FROM users WHERE id=? AND role='doctor'`).get(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  res.json(publicUser(d));
});

app.post('/api/doctors', auth, requireRole('admin'), (req, res) => {
  const { firstName, lastName, email, password, gender, specialty, phone } = req.body;
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'Email already registered' });
  const info = db.prepare(`INSERT INTO users (role, first_name, last_name, email, password_hash, gender, specialty, phone)
    VALUES ('doctor', ?, ?, ?, ?, ?, ?, ?)`)
    .run(firstName, lastName || '', email, bcrypt.hashSync(password || 'password123', 10), gender || '', specialty || '', phone || '');
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const wh = db.prepare('INSERT INTO working_hours (doctor_id, day, start_time, end_time) VALUES (?, ?, ?, ?)');
  for (const day of days) wh.run(info.lastInsertRowid, day, '09:00', '16:00');
  res.json(publicUser(getUser(info.lastInsertRowid)));
});

app.delete('/api/users/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- patients ----------
app.get('/api/patients', auth, requireRole('doctor', 'admin'), (req, res) => {
  const { search = '', gender = '' } = req.query;
  let rows;
  if (req.user.role === 'doctor') {
    rows = db.prepare(`
      SELECT DISTINCT u.* FROM users u JOIN appointments a ON a.patient_id = u.id
      WHERE a.doctor_id = ? AND (u.first_name || ' ' || u.last_name LIKE ?)
      ORDER BY u.first_name COLLATE NOCASE`).all(req.user.id, `%${search}%`);
  } else {
    rows = db.prepare(`
      SELECT * FROM users WHERE role='patient'
      AND (first_name || ' ' || last_name LIKE ? OR email LIKE ?)
      AND (? = '' OR gender = ?)
      ORDER BY first_name COLLATE NOCASE`).all(`%${search}%`, `%${search}%`, gender, gender);
  }
  res.json(rows.map(publicUser));
});

// ---------- admins ----------
app.get('/api/admins', auth, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`SELECT * FROM users WHERE role='admin' AND (first_name || ' ' || last_name LIKE ?)`)
    .all(`%${req.query.search || ''}%`);
  res.json(rows.map(publicUser));
});

app.post('/api/admins', auth, requireRole('admin'), (req, res) => {
  const { name, email, phone, role } = req.body;
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(409).json({ error: 'Email already registered' });
  const [first, ...rest] = (name || '').trim().split(' ');
  const info = db.prepare(`INSERT INTO users (role, first_name, last_name, email, phone, admin_role, password_hash)
    VALUES ('admin', ?, ?, ?, ?, ?, ?)`)
    .run(first || '', rest.join(' '), email, phone || '', role === 'moderator' ? 'moderator' : 'super', bcrypt.hashSync('password123', 10));
  res.json(publicUser(getUser(info.lastInsertRowid)));
});

// ---------- working hours ----------
app.get('/api/working-hours/:doctorId', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM working_hours WHERE doctor_id=?').all(req.params.doctorId));
});

app.put('/api/working-hours/:doctorId', auth, requireRole('doctor'), (req, res) => {
  if (Number(req.params.doctorId) !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const stmt = db.prepare(`INSERT INTO working_hours (doctor_id, day, start_time, end_time) VALUES (?, ?, ?, ?)
    ON CONFLICT(doctor_id, day) DO UPDATE SET start_time=excluded.start_time, end_time=excluded.end_time`);
  for (const { day, start_time, end_time } of req.body.hours || []) stmt.run(req.user.id, day, start_time, end_time);
  res.json(db.prepare('SELECT * FROM working_hours WHERE doctor_id=?').all(req.user.id));
});

// ---------- appointments ----------
const APPT_SELECT = `
  SELECT a.*, d.first_name AS doctor_first, d.last_name AS doctor_last, d.specialty AS doctor_specialty, d.avatar AS doctor_avatar, d.gender AS doctor_gender,
         p.first_name AS patient_first, p.last_name AS patient_last, p.avatar AS patient_avatar, p.gender AS patient_gender
  FROM appointments a
  JOIN users d ON d.id = a.doctor_id
  JOIN users p ON p.id = a.patient_id`;

app.get('/api/appointments', auth, (req, res) => {
  const { id, role } = req.user;
  let rows;
  if (role === 'patient') rows = db.prepare(`${APPT_SELECT} WHERE a.patient_id=? ORDER BY a.date`).all(id);
  else if (role === 'doctor') rows = db.prepare(`${APPT_SELECT} WHERE a.doctor_id=? ORDER BY a.date`).all(id);
  else rows = db.prepare(`${APPT_SELECT} ORDER BY a.date`).all();
  res.json(rows);
});

app.post('/api/appointments', auth, (req, res) => {
  const { doctorId, title, description = '', date } = req.body;
  if (!doctorId || !title || !date) return res.status(400).json({ error: 'Missing required fields' });
  const info = db.prepare(`INSERT INTO appointments (patient_id, doctor_id, title, description, date, status) VALUES (?, ?, ?, ?, ?, 'pending')`)
    .run(req.user.id, doctorId, title, description, date);
  const appt = db.prepare(`${APPT_SELECT} WHERE a.id=?`).get(info.lastInsertRowid);
  notifyBooked({ patient: getUser(req.user.id), doctor: getUser(doctorId), appt });
  res.json(appt);
});

app.put('/api/appointments/:id', auth, (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id=?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Not found' });
  const { id, role } = req.user;
  if (role === 'patient' && appt.patient_id !== id) return res.status(403).json({ error: 'Forbidden' });
  if (role === 'doctor' && appt.doctor_id !== id) return res.status(403).json({ error: 'Forbidden' });
  const { title = appt.title, description = appt.description, date = appt.date, status = appt.status } = req.body;
  db.prepare('UPDATE appointments SET title=?, description=?, date=?, status=? WHERE id=?')
    .run(title, description, date, status, appt.id);
  const updated = db.prepare(`${APPT_SELECT} WHERE a.id=?`).get(appt.id);
  if (status !== appt.status) {
    notifyStatusChange({ patient: getUser(appt.patient_id), doctor: getUser(appt.doctor_id), appt: updated });
  }
  res.json(updated);
});

app.delete('/api/appointments/:id', auth, (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- medical records ----------
const RECORD_SELECT = `SELECT r.* FROM records r`;
const recordDoctors = (recordId) =>
  db.prepare(`SELECT u.id, u.first_name, u.last_name, u.avatar FROM users u
    JOIN record_doctors rd ON rd.doctor_id = u.id WHERE rd.record_id=?`).all(recordId);

app.get('/api/records', auth, (req, res) => {
  const { id, role } = req.user;
  let rows;
  if (role === 'patient') rows = db.prepare(`${RECORD_SELECT} WHERE r.patient_id=? ORDER BY r.created_at DESC`).all(id);
  else if (role === 'doctor') rows = db.prepare(`${RECORD_SELECT} JOIN record_doctors rd ON rd.record_id = r.id WHERE rd.doctor_id=? ORDER BY r.created_at DESC`).all(id);
  else rows = db.prepare(`${RECORD_SELECT} ORDER BY r.created_at DESC`).all();
  res.json(rows.map((r) => ({ ...r, doctors: recordDoctors(r.id) })));
});

app.post('/api/records', auth, requireRole('patient'), upload.single('file'), (req, res) => {
  const { title, description = '' } = req.body;
  const doctorIds = JSON.parse(req.body.doctorIds || '[]');
  const info = db.prepare('INSERT INTO records (patient_id, title, description, file_path, file_name) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, title, description, req.file ? `/uploads/${req.file.filename}` : '', req.file ? req.file.originalname : '');
  const link = db.prepare('INSERT INTO record_doctors (record_id, doctor_id) VALUES (?, ?)');
  for (const d of doctorIds) link.run(info.lastInsertRowid, d);
  const r = db.prepare('SELECT * FROM records WHERE id=?').get(info.lastInsertRowid);
  res.json({ ...r, doctors: recordDoctors(r.id) });
});

app.put('/api/records/:id', auth, upload.single('file'), (req, res) => {
  const r = db.prepare('SELECT * FROM records WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'patient' && r.patient_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { title = r.title, description = r.description } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : r.file_path;
  const file_name = req.file ? req.file.originalname : r.file_name;
  db.prepare('UPDATE records SET title=?, description=?, file_path=?, file_name=? WHERE id=?')
    .run(title, description, file_path, file_name, r.id);
  if (req.body.doctorIds) {
    db.prepare('DELETE FROM record_doctors WHERE record_id=?').run(r.id);
    const link = db.prepare('INSERT INTO record_doctors (record_id, doctor_id) VALUES (?, ?)');
    for (const d of JSON.parse(req.body.doctorIds)) link.run(r.id, d);
  }
  const updated = db.prepare('SELECT * FROM records WHERE id=?').get(r.id);
  res.json({ ...updated, doctors: recordDoctors(r.id) });
});

app.delete('/api/records/:id', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM records WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'patient' && r.patient_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM records WHERE id=?').run(r.id);
  res.json({ ok: true });
});

// ---------- messages ----------
app.get('/api/conversations', auth, (req, res) => {
  const { id, role } = req.user;
  // chat partners: for a patient — all doctors; for a doctor — patients who messaged or have appointments
  let partners;
  if (role === 'patient') {
    partners = db.prepare(`SELECT * FROM users WHERE role='doctor'`).all();
  } else {
    partners = db.prepare(`
      SELECT DISTINCT u.* FROM users u
      WHERE u.role='patient' AND (
        u.id IN (SELECT sender_id FROM messages WHERE receiver_id=?)
        OR u.id IN (SELECT receiver_id FROM messages WHERE sender_id=?)
        OR u.id IN (SELECT patient_id FROM appointments WHERE doctor_id=?)
      )`).all(id, id, id);
  }
  const lastMsg = db.prepare(`
    SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
    ORDER BY id DESC LIMIT 1`);
  res.json(partners.map((p) => ({
    user: publicUser(p),
    lastMessage: lastMsg.get(id, p.id, p.id, id) || null,
  })));
});

app.get('/api/messages/:userId', auth, (req, res) => {
  const other = Number(req.params.userId);
  const rows = db.prepare(`
    SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
    ORDER BY id ASC`).all(req.user.id, other, other, req.user.id);
  res.json(rows);
});

// ---------- AI doctor ----------
const AI_SYSTEM = `You are the "AI Doctor" assistant inside MedFlow, a healthcare app.
Give short, friendly general-health guidance. Always remind users you are not a real doctor
and that they should book an appointment with one of the doctors on the platform for anything serious.
Never diagnose or prescribe. Keep answers under 120 words.`;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const CANNED = [
  "I'm your AI health assistant. I can share general wellness tips, but for anything specific please book an appointment with one of our doctors.",
  'That sounds uncomfortable. Rest, stay hydrated, and monitor your symptoms. If they persist more than a few days, please consult one of our doctors.',
  'Thanks for sharing. I recommend keeping track of when the symptoms started and how they evolve — that will help your doctor a lot.',
  "I can't diagnose conditions, but our doctors can! You can book an appointment from the Doctors page.",
];

app.post('/api/ai/chat', auth, async (req, res) => {
  const { messages = [] } = req.body; // [{role:'user'|'assistant', content}]
  if (!anthropic) {
    const n = messages.filter((m) => m.role === 'user').length;
    return res.json({ reply: CANNED[Math.min(n - 1, CANNED.length - 1)] || CANNED[0], offline: true });
  }
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: AI_SYSTEM,
      messages: messages.map(({ role, content }) => ({ role, content })),
    });
    const reply = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    res.json({ reply });
  } catch (err) {
    console.error('AI doctor error:', err.message);
    res.json({ reply: CANNED[0], offline: true });
  }
});

// ---------- socket.io real-time chat ----------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  try {
    socket.user = jwt.verify(socket.handshake.auth?.token, JWT_SECRET);
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);
  socket.on('message', ({ to, text }) => {
    if (!to || !text?.trim()) return;
    const info = db.prepare('INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)')
      .run(socket.user.id, to, text.trim());
    const msg = db.prepare('SELECT * FROM messages WHERE id=?').get(info.lastInsertRowid);
    io.to(`user:${to}`).to(`user:${socket.user.id}`).emit('message', msg);
  });
});

server.listen(PORT, () => console.log(`MedFlow server running on http://localhost:${PORT}`));
