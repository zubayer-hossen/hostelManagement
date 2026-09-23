import { Meeting } from '../models/Meeting.js';
import { PERMISSIONS as P } from '../constants/permissions.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination } from '../utils/response.js';
import { generateSlots, slotProblem, slotStartsAt, weekday, isValidDate } from '../utils/slots.js';
import { getSettings } from './settingsService.js';
import { notify, notifyStaff } from './notificationService.js';
import { logAudit } from './auditService.js';

const DEFAULTS = { enabled: true, days: [0, 1, 2, 3, 4], startTime: '10:00', endTime: '17:00', slotMinutes: 30, maxPerSlot: 1, maxAdvanceDays: 30, utcOffsetMinutes: 360, blackoutDates: [] };
const MAX_UPCOMING_PER_USER = 3;

export async function getConfig() {
  const s = await getSettings();
  const m = s.meetings?.toObject ? s.meetings.toObject() : s.meetings || {};
  return { ...DEFAULTS, ...Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined && v !== null)) };
}

/** Slots for one day with how many places are left. The server re-checks everything again at booking time. */
export async function getAvailability(date) {
  if (!isValidDate(date)) throw ApiError.badRequest('Invalid date');
  const cfg = await getConfig();
  const dayOpen = cfg.enabled && cfg.days.includes(weekday(date)) && !cfg.blackoutDates.includes(date);
  if (!dayOpen) return { date, open: false, slots: [] };

  const counts = await Meeting.aggregate([{ $match: { date, isActive: true } }, { $group: { _id: '$time', n: { $sum: 1 } } }]);
  const taken = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  const now = new Date();
  const slots = generateSlots(cfg).map((time) => {
    const left = Math.max(0, cfg.maxPerSlot - (taken[time] || 0));
    return { time, left, bookable: left > 0 && slotProblem({ date, time }, cfg, now) === null };
  });
  return { date, open: true, slots };
}

export async function createMeeting(user, { date, time, type, reason }, req) {
  const cfg = await getConfig();
  const problem = slotProblem({ date, time }, cfg);
  if (problem) throw ApiError.badRequest(problem, { code: 'SLOT_UNAVAILABLE' });

  const upcoming = await Meeting.countDocuments({ user: user._id, isActive: true, startsAt: { $gt: new Date() } });
  if (upcoming >= MAX_UPCOMING_PER_USER) throw ApiError.conflict(`You already have ${MAX_UPCOMING_PER_USER} upcoming meetings. Cancel one first.`, { code: 'TOO_MANY_MEETINGS' });
  const slotKey = `${date}T${time}`;
  if (await Meeting.exists({ user: user._id, slotKey, isActive: true })) throw ApiError.conflict('You already have a meeting at that time', { code: 'DUPLICATE_MEETING' });

  const startsAt = slotStartsAt(date, time, cfg.utcOffsetMinutes);
  const endsAt = new Date(startsAt.getTime() + cfg.slotMinutes * 60000);

  // Capacity is enforced by the database: seq 1..maxPerSlot is unique per slot, so the (max+1)-th request always fails.
  for (let seq = 1; seq <= cfg.maxPerSlot; seq += 1) {
    try {
      const meeting = await Meeting.create({ user: user._id, type, date, time, startsAt, endsAt, reason, slotKey, seq });
      const when = `${date} ${time}`;
      await notify(user._id, { type: 'meeting.confirmed', title: 'Meeting confirmed', body: `${when} (${type.replace('_', ' ')})`, link: '/dashboard/meetings' }, { email: true });
      await notifyStaff(P.MANAGE_MEETINGS, { type: 'meeting.new', title: 'New meeting booked', body: `${user.name} — ${when}`, link: '/dashboard/manage/meetings' });
      await logAudit({ req, actor: user, action: 'meeting.booked', entity: 'Meeting', entityId: meeting._id, metadata: { date, time, type } });
      return meeting;
    } catch (err) {
      if (err?.code !== 11000) throw err; // seq taken by a concurrent request: try the next place
    }
  }
  throw ApiError.conflict('Sorry, that time was just taken. Please pick another slot.', { code: 'SLOT_FULL' });
}

export const listMine = (userId) => Meeting.find({ user: userId }).sort({ startsAt: -1 }).limit(100);

export async function cancel(actor, id, reason, req, isStaff) {
  const m = await Meeting.findOne(isStaff ? { _id: id } : { _id: id, user: actor._id });
  if (!m) throw ApiError.notFound('Meeting not found');
  if (m.status !== 'confirmed') throw ApiError.conflict('Only a confirmed meeting can be cancelled');
  if (!isStaff && m.startsAt <= new Date()) throw ApiError.conflict('This meeting has already started');

  const res = await Meeting.updateOne({ _id: m._id, status: 'confirmed' }, { $set: { status: 'cancelled', isActive: false, cancelledBy: actor._id, cancelReason: reason || '' } });
  if (!res.modifiedCount) throw ApiError.conflict('This meeting was just changed. Refresh and try again.');
  if (isStaff && String(m.user) !== String(actor._id)) {
    await notify(m.user, { type: 'meeting.cancelled', title: 'Your meeting was cancelled', body: `${m.date} ${m.time}${reason ? ` — ${reason}` : ''}`, link: '/dashboard/meetings' }, { email: true });
  }
  await logAudit({ req, action: 'meeting.cancelled', entity: 'Meeting', entityId: m._id, metadata: { by: isStaff ? 'staff' : 'user' } });
  return Meeting.findById(m._id);
}

export async function listAll(q) {
  const f = {};
  if (q.status) f.status = q.status;
  if (q.from || q.to) f.date = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };
  const [items, total] = await Promise.all([
    Meeting.find(f).sort({ startsAt: q.order === 'desc' ? -1 : 1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('user', 'name email phone'),
    Meeting.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

/** Staff closes a meeting that took place (completed) or where the person did not come (no_show). */
export async function setOutcome(actor, id, status, req) {
  const m = await Meeting.findOneAndUpdate({ _id: id, status: 'confirmed' }, { $set: { status, isActive: false } }, { new: true });
  if (!m) throw ApiError.conflict('Meeting not found or already closed');
  await logAudit({ req, action: `meeting.${status}`, entity: 'Meeting', entityId: m._id });
  return m;
}
