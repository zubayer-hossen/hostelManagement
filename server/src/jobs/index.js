import cron from 'node-cron';
import { config } from '../config/env.js';
import { Due } from '../models/Due.js';
import { Meeting } from '../models/Meeting.js';
import { expireStaleBookings } from '../services/bookingMaintenance.js';
import { markOverdue } from '../services/financeService.js';
import { notify } from '../services/notificationService.js';
import { dueReminderKind } from '../utils/reminders.js';

const money = (n) => `৳ ${n.toLocaleString('en-US')}`;

/** Wraps a job so one failure never stops the schedule or crashes the server. */
const safe = (name, fn) => async () => {
  try {
    const result = await fn();
    if (result) console.info(`[jobs] ${name}: ${result}`);
  } catch (err) {
    console.error(`[jobs] ${name} failed:`, err.message);
  }
};

/** Reminds residents about rent due within 3 days, and again weekly while overdue. */
export async function sendDueReminders(now = new Date()) {
  const horizon = new Date(now.getTime() + 3 * 864e5);
  const dues = await Due.find({ isVoid: false, status: { $in: ['due', 'partially_paid', 'overdue'] }, dueDate: { $lte: horizon } }).limit(500);
  let sent = 0;
  for (const due of dues) {
    const kind = dueReminderKind(due, now);
    if (!kind) continue;
    // Claim the reminder first (conditional update) so two server instances can never both send it.
    const claim = await Due.updateOne({ _id: due._id, lastReminderAt: due.lastReminderAt ?? null }, { $set: { lastReminderAt: now } });
    if (!claim.modifiedCount) continue;
    const balance = Math.round((due.amount - due.paidAmount) * 100) / 100;
    await notify(due.user, {
      type: `due.reminder_${kind}`,
      title: kind === 'overdue' ? 'Your payment is overdue' : 'Payment due soon',
      body: `${money(balance)} — ${due.description || `rent ${due.month}/${due.year}`}`,
      link: '/dashboard/resident/payments',
    }, { email: true });
    sent += 1;
  }
  return sent ? `${sent} due reminder(s) sent` : null;
}

/** Reminds people about a confirmed meeting that starts within the next 24 hours (once). */
export async function sendMeetingReminders(now = new Date()) {
  const soon = new Date(now.getTime() + 24 * 3600 * 1000);
  const meetings = await Meeting.find({ status: 'confirmed', isActive: true, reminderSentAt: null, startsAt: { $gt: now, $lte: soon } }).limit(200);
  let sent = 0;
  for (const m of meetings) {
    const claim = await Meeting.updateOne({ _id: m._id, reminderSentAt: null }, { $set: { reminderSentAt: now } });
    if (!claim.modifiedCount) continue;
    await notify(m.user, { type: 'meeting.reminder', title: 'Meeting reminder', body: `${m.date} at ${m.time} (${m.type.replace('_', ' ')})`, link: '/dashboard/meetings' }, { email: true });
    sent += 1;
  }
  return sent ? `${sent} meeting reminder(s) sent` : null;
}

const tasks = [];

/**
 * Starts the background jobs (node-cron, this process only). Content that "expires" (banners, headlines, notices)
 * or is "scheduled" (publishAt / startsAt) needs no job: public queries already filter by those dates.
 * Run with ENABLE_SCHEDULER=true on exactly one instance.
 */
export function startScheduler() {
  if (!config.ENABLE_SCHEDULER) { console.info('[jobs] scheduler disabled (ENABLE_SCHEDULER=false)'); return; }
  const add = (expr, name, fn) => tasks.push(cron.schedule(expr, safe(name, fn)));

  add('*/15 * * * *', 'expire booking holds', async () => { const n = await expireStaleBookings({ force: true }); return n ? `${n} request(s) expired` : null; });
  add('5 * * * *', 'mark overdue dues', () => markOverdue({ force: true }).then(() => null));
  add('0 9 * * *', 'due reminders', () => sendDueReminders());
  add('*/15 * * * *', 'meeting reminders', () => sendMeetingReminders());
  console.info(`[jobs] scheduler started (${tasks.length} jobs)`);
}

export const stopScheduler = () => { tasks.forEach((t) => t.stop()); tasks.length = 0; };
