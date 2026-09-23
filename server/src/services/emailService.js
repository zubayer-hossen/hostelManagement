import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter;

function getTransporter() {
  if (!config.emailEnabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_SECURE,
      auth: config.EMAIL_USER ? { user: config.EMAIL_USER, pass: config.EMAIL_PASSWORD } : undefined,
    });
  }
  return transporter;
}

const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function layout({ hostelName, heading, bodyHtml, ctaLabel, ctaUrl, footer }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#4f46e5;color:#fff;padding:20px 28px;font-size:18px;font-weight:bold">${escapeHtml(hostelName)}</td></tr>
      <tr><td style="padding:28px">
        <h2 style="margin:0 0 12px;font-size:20px">${escapeHtml(heading)}</h2>
        ${bodyHtml}
        ${ctaUrl ? `<p style="margin:24px 0"><a href="${escapeHtml(ctaUrl)}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block">${escapeHtml(ctaLabel)}</a></p>
        <p style="font-size:12px;color:#6b7280">If the button does not work, copy this link into your browser:<br>${escapeHtml(ctaUrl)}</p>` : ''}
        <p style="font-size:12px;color:#6b7280;margin-top:24px">${escapeHtml(footer || '')}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    // Development fallback: no SMTP configured, so print the message instead of sending it.
    if (!config.isProd) {
      console.info(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] ${text}\n`);
    } else {
      console.warn(`[email] EMAIL_HOST is not configured — e-mail to ${to} ("${subject}") was NOT sent.`);
    }
    return { sent: false };
  }
  await t.sendMail({ from: config.EMAIL_FROM, to, subject, html, text });
  return { sent: true };
}

/** E-mail failures must never break the user-facing action; they are logged and swallowed. */
async function safeSend(payload) {
  try {
    return await sendMail(payload);
  } catch (err) {
    console.error('[email] send failed:', err.message);
    return { sent: false };
  }
}

export const emailTemplates = {
  verification: ({ name, url, hostelName }) => ({
    subject: `Verify your email — ${hostelName}`,
    text: `Hi ${name}, verify your email address: ${url} (valid for 24 hours).`,
    html: layout({
      hostelName,
      heading: 'Verify your email address',
      bodyHtml: `<p>Hi ${escapeHtml(name)}, thanks for creating an account. Please confirm your email address. This link is valid for 24 hours.</p>`,
      ctaLabel: 'Verify email',
      ctaUrl: url,
      footer: 'If you did not create this account you can ignore this email.',
    }),
  }),
  passwordReset: ({ name, url, hostelName }) => ({
    subject: `Reset your password — ${hostelName}`,
    text: `Hi ${name}, reset your password: ${url} (valid for 1 hour). If you did not request this, ignore this email.`,
    html: layout({
      hostelName,
      heading: 'Reset your password',
      bodyHtml: `<p>Hi ${escapeHtml(name)}, we received a request to reset your password. This link is valid for 1 hour.</p>`,
      ctaLabel: 'Choose a new password',
      ctaUrl: url,
      footer: 'If you did not request a password reset, no action is needed — your password stays the same.',
    }),
  }),
  passwordChanged: ({ name, hostelName }) => ({
    subject: `Your password was changed — ${hostelName}`,
    text: `Hi ${name}, your password was just changed. If this was not you, reset it immediately and contact the hostel.`,
    html: layout({
      hostelName,
      heading: 'Your password was changed',
      bodyHtml: `<p>Hi ${escapeHtml(name)}, your account password was just changed. If this was not you, reset your password immediately and contact the hostel office.</p>`,
    }),
  }),
};

export const sendVerificationEmail = (user, url, hostelName) =>
  safeSend({ to: user.email, ...emailTemplates.verification({ name: user.name, url, hostelName }) });

export const sendPasswordResetEmail = (user, url, hostelName) =>
  safeSend({ to: user.email, ...emailTemplates.passwordReset({ name: user.name, url, hostelName }) });

export const sendPasswordChangedEmail = (user, hostelName) =>
  safeSend({ to: user.email, ...emailTemplates.passwordChanged({ name: user.name, hostelName }) });

/** Generic transactional e-mail used for every event (booking decision, payment receipt, warning, ticket update …). */
export const sendEventEmail = (to, { name, subject, heading, lines = [], link, linkLabel }, hostelName) =>
  safeSend({
    to,
    subject: `${subject} — ${hostelName}`,
    text: `Hi ${name}, ${lines.join(' ')}${link ? ` ${link}` : ''}`,
    html: layout({
      hostelName,
      heading: heading || subject,
      bodyHtml: `<p>Hi ${escapeHtml(name)},</p>${lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}`,
      ctaLabel: linkLabel || 'Open',
      ctaUrl: link,
    }),
  });
