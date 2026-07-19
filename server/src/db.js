import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'medflow.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('patient','doctor','admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  description TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  services TEXT DEFAULT '',
  admin_role TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS working_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '16:00',
  UNIQUE (doctor_id, day)
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS record_doctors (
  record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

try {
  db.exec(`ALTER TABLE users ADD COLUMN qualifications TEXT DEFAULT ''`);
} catch { /* column already exists */ }

export function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return;
  const hash = bcrypt.hashSync('password123', 10);
  const insert = db.prepare(`INSERT INTO users
    (role, first_name, last_name, email, password_hash, phone, gender, description, specialty, services, admin_role)
    VALUES (@role, @first_name, @last_name, @email, @hash, @phone, @gender, @description, @specialty, @services, @admin_role)`);
  const base = { hash, phone: '', gender: '', description: '', specialty: '', services: '', admin_role: '' };

  const admin = insert.run({ ...base, role: 'admin', first_name: 'Sarra', last_name: 'Garbouj', email: 'admin@medflow.com', phone: '22898972', gender: 'female', admin_role: 'super' });
  const doc1 = insert.run({
    ...base, role: 'doctor', first_name: 'Soulaima', last_name: 'Gharbi', email: 'doctor@medflow.com',
    phone: '22898972', gender: 'female', specialty: 'therapist', services: 'service 1,service 2,service 3',
    description: "I'm a dedicated therapist with expertise in cognitive-behavioral therapy (CBT), mindfulness, and trauma-informed care. I help individuals navigate anxiety, depression, and life transitions by providing a supportive and non-judgmental space for personal growth and healing. Passionate about mental health advocacy and empowering clients to improve their emotional wellbeing."
  });
  db.prepare(`UPDATE users SET qualifications = 'qualification 1,qualification 2,qualification 3', avatar = '/uploads/soulaima.svg' WHERE id = ?`)
    .run(doc1.lastInsertRowid);
  const doc2 = insert.run({ ...base, role: 'doctor', first_name: 'gestu', last_name: 'modro', email: 'gestumodro@gufum.com', gender: 'male', specialty: 'therapist', services: 'service 1,service 2' });
  const pat1 = insert.run({ ...base, role: 'patient', first_name: 'alex', last_name: 'smith', email: 'patient@medflow.com', gender: 'male' });
  const pat2 = insert.run({ ...base, role: 'patient', first_name: 'sarra', last_name: 'lopez', email: 'befyefufyo@gufum.com', gender: 'female' });
  const pat3 = insert.run({ ...base, role: 'patient', first_name: 'basma', last_name: 'abd hakim', email: 'batobov826@cutxsew.com', gender: 'female' });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const wh = db.prepare('INSERT INTO working_hours (doctor_id, day, start_time, end_time) VALUES (?, ?, ?, ?)');
  for (const d of [doc1.lastInsertRowid, doc2.lastInsertRowid]) {
    for (const day of days) wh.run(d, day, day === 'monday' ? '10:30' : day === 'sunday' ? '08:30' : '09:00', '16:00');
  }

  const appt = db.prepare('INSERT INTO appointments (patient_id, doctor_id, title, description, date, status) VALUES (?, ?, ?, ?, ?, ?)');
  const now = new Date();
  const iso = (offsetDays, h, m) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, h, m);
    return d.toISOString();
  };
  appt.run(pat1.lastInsertRowid, doc1.lastInsertRowid, 'visite 1', '', iso(-5, 10, 0), 'completed');
  appt.run(pat2.lastInsertRowid, doc1.lastInsertRowid, 'controle', '', iso(2, 14, 0), 'confirmed');
  appt.run(pat3.lastInsertRowid, doc1.lastInsertRowid, 'controle', '', iso(3, 10, 30), 'cancelled');
  appt.run(pat1.lastInsertRowid, doc1.lastInsertRowid, 'Urgent Appointment', 'my back hurts and i have fever', iso(1, 14, 30), 'confirmed');

  const msg = db.prepare('INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)');
  msg.run(pat1.lastInsertRowid, doc1.lastInsertRowid, 'hi doctor');
  msg.run(doc1.lastInsertRowid, pat1.lastInsertRowid, 'Hi, how can i help you ?');

  console.log('Seeded database. Logins: admin@medflow.com / doctor@medflow.com / patient@medflow.com — password: password123');
}

export default db;
