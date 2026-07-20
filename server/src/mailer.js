import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tiny .env loader (KEY=VALUE lines, # comments) so no extra dependency is needed.
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: (SMTP_PASS || '').replace(/\s+/g, '') } : undefined,
    })
  : null;

export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(`\n[mail:offline] To: ${to}\n[mail:offline] Subject: ${subject}\n[mail:offline] ${text}\n`);
    return { offline: true };
  }
  try {
    const info = await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    console.log(`[mail] sent "${subject}" to ${to} (${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`[mail] failed to send to ${to}:`, err.message);
    return { error: err.message };
  }
}

const wrap = (body) => `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e3ece7;border-radius:12px;overflow:hidden">
    <div style="background:#22d381;padding:18px 24px;color:#fff;font-size:18px;font-weight:700">MedFlow</div>
    <div style="padding:24px;color:#333;font-size:14px;line-height:1.6">${body}</div>
    <div style="padding:14px 24px;background:#f6f9f7;color:#8a968f;font-size:12px">
      MedFlow — Healthcare Solutions. This is an automated message, please do not reply.
    </div>
  </div>`;

export function notifyBooked({ patient, doctor, appt }) {
  const when = new Date(appt.date).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  sendMail({
    to: patient.email,
    subject: 'Your appointment has been booked',
    text: `Hi ${patient.first_name}, we notify you that your appointment "${appt.title}" has been booked with ${doctor.first_name} ${doctor.last_name} for ${when}. Please wait for confirmation.`,
    html: wrap(`Hi <b>${patient.first_name}</b>,<br><br>
      Your appointment <b>"${appt.title}"</b> has been booked with
      <b>Dr. ${doctor.first_name} ${doctor.last_name}</b> for <b>${when}</b>.<br><br>
      Please wait for the doctor's confirmation.`),
  });
  sendMail({
    to: doctor.email,
    subject: 'New appointment request',
    text: `Hi Dr. ${doctor.first_name}, ${patient.first_name} ${patient.last_name} booked "${appt.title}" for ${when}. Please confirm or cancel it from your dashboard.`,
    html: wrap(`Hi <b>Dr. ${doctor.first_name}</b>,<br><br>
      <b>${patient.first_name} ${patient.last_name}</b> booked
      <b>"${appt.title}"</b> for <b>${when}</b>.<br><br>
      Please confirm or cancel it from your appointments dashboard.`),
  });
}

export function notifyStatusChange({ patient, doctor, appt }) {
  const when = new Date(appt.date).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const messages = {
    confirmed: {
      subject: 'Your appointment has been confirmed',
      body: `Good news! Dr. ${doctor.first_name} ${doctor.last_name} confirmed your appointment <b>"${appt.title}"</b> for <b>${when}</b>.`,
    },
    cancelled: {
      subject: 'Your appointment has been cancelled',
      body: `Unfortunately your appointment <b>"${appt.title}"</b> with Dr. ${doctor.first_name} ${doctor.last_name} scheduled for <b>${when}</b> has been cancelled.`,
    },
    completed: {
      subject: 'Your appointment is completed',
      body: `Your appointment <b>"${appt.title}"</b> with Dr. ${doctor.first_name} ${doctor.last_name} has been marked as completed. Thank you for using MedFlow!`,
    },
  };
  const msg = messages[appt.status];
  if (!msg) return;
  sendMail({
    to: patient.email,
    subject: msg.subject,
    text: msg.body.replace(/<[^>]+>/g, ''),
    html: wrap(`Hi <b>${patient.first_name}</b>,<br><br>${msg.body}`),
  });
}
