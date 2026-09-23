import crypto from 'node:crypto';
import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { STAFF_ROLES } from '../constants/roles.js';
import { PERMISSIONS as P } from '../constants/permissions.js';
import { canTicketTransition, defaultPriority } from '../constants/support.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { generateRandomToken, sha256 } from '../utils/tokens.js';
import { notify, notifyStaff } from './notificationService.js';
import { sendEventEmail } from './emailService.js';
import { getHostelName } from './settingsService.js';
import { logAudit } from './auditService.js';

const newCode = () => `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const link = (path) => `${config.CLIENT_URL.replace(/\/$/, '')}${path}`;

/** Requester-safe view: no internal notes, no staff identities beyond a first name, never the token hash. */
export function forRequester(ticket) {
  const o = ticket.toJSON();
  o.messages = o.messages.filter((m) => !m.internal).map((m) => ({ ...m, by: undefined, byName: m.side === 'staff' ? 'Hostel staff' : m.byName }));
  delete o.assignedTo;
  return o;
}

async function emailRequester(ticket, { subject, lines, path }) {
  await sendEventEmail(ticket.requester.email, { name: ticket.requester.name, subject, lines, link: path ? link(path) : undefined, linkLabel: 'Open ticket' }, await getHostelName());
}

/** Anyone can open a ticket. Signed-in users are linked to their account; guests get a secret to follow up. */
export async function createTicket(user, data, req) {
  const requester = user
    ? { name: user.name, email: user.email, phone: data.phone || user.phone || '' }
    : { name: data.name, email: data.email, phone: data.phone || '' };
  if (!requester.name || !requester.email) {
    throw ApiError.badRequest('Name and e-mail are required', { errors: [{ field: 'name', message: 'Name and e-mail are required' }] });
  }

  const token = user ? null : generateRandomToken(16); // 32 hex chars
  for (let attempt = 0; ; attempt += 1) {
    try {
      const ticket = await SupportTicket.create({
        code: newCode(), user: user?._id ?? null, requester, category: data.category, subject: data.subject,
        priority: defaultPriority(data.category), trackingTokenHash: token ? sha256(token) : undefined,
        messages: [{ by: user?._id ?? null, byName: requester.name, side: 'requester', text: data.message }],
      });
      await logAudit({ req, actor: user ?? undefined, action: 'ticket.created', entity: 'SupportTicket', entityId: ticket._id, metadata: { category: ticket.category } });
      await notifyStaff(P.MANAGE_SUPPORT, { type: 'ticket.new', title: `New ${ticket.priority === 'urgent' ? 'URGENT ' : ''}support ticket`, body: `${ticket.code}: ${ticket.subject}`, link: '/dashboard/manage/support' });
      await emailRequester(ticket, {
        subject: `We received your request (${ticket.code})`,
        lines: [`Your ticket ${ticket.code} — "${ticket.subject}" — was received. We will reply as soon as possible.`, ...(token ? [`Keep this tracking key to follow up on the Support page: ${token}`] : [])],
        path: user ? '/dashboard/support' : '/support',
      });
      return { ticket, trackingToken: token };
    } catch (err) {
      if (!(err?.code === 11000 && attempt < 3)) throw err;
    }
  }
}

async function findByToken(code, token) {
  const ticket = await SupportTicket.findOne({ code }).select('+trackingTokenHash');
  const ok = ticket?.trackingTokenHash && crypto.timingSafeEqual(Buffer.from(ticket.trackingTokenHash), Buffer.from(sha256(token)));
  if (!ok) throw ApiError.notFound('No ticket matches that code and key'); // same answer for wrong code or wrong key
  return ticket;
}

export async function track({ code, token }) {
  return forRequester(await findByToken(code, token));
}

async function addRequesterMessage(ticket, text, user) {
  if (ticket.status === 'closed') throw ApiError.conflict('This ticket is closed. Please open a new one.');
  ticket.messages.push({ by: user?._id ?? null, byName: ticket.requester.name, side: 'requester', text });
  ticket.lastActivityAt = new Date();
  if (['resolved', 'waiting'].includes(ticket.status)) ticket.status = 'in_progress'; // a reply reopens it for staff
  await ticket.save();
  await notifyStaff(P.MANAGE_SUPPORT, { type: 'ticket.reply', title: 'New reply on a ticket', body: `${ticket.code}: ${ticket.subject}`, link: '/dashboard/manage/support' });
  return ticket;
}

export async function guestReply({ code, token, text }) {
  return forRequester(await addRequesterMessage(await findByToken(code, token), text, null));
}

export const listMine = (userId) => SupportTicket.find({ user: userId }).sort({ lastActivityAt: -1 }).limit(100);

export async function getMine(userId, id) {
  const t = await SupportTicket.findOne({ _id: id, user: userId });
  if (!t) throw ApiError.notFound('Ticket not found');
  return t;
}
export async function userReply(user, id, text) {
  return forRequester(await addRequesterMessage(await getMine(user._id, id), text, user));
}

// ── staff (manageSupport) ──
export async function listAll(q) {
  const f = {};
  for (const k of ['status', 'category', 'priority']) if (q[k]) f[k] = q[k];
  if (q.assignedTo) f.assignedTo = q.assignedTo;
  if (q.search) { const rx = new RegExp(escapeRegex(q.search), 'i'); f.$or = [{ subject: rx }, { code: rx }, { 'requester.name': rx }, { 'requester.email': rx }]; }
  const [items, total] = await Promise.all([
    SupportTicket.find(f).sort({ lastActivityAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('assignedTo', 'name'),
    SupportTicket.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

export async function getForStaff(id) {
  const t = await SupportTicket.findById(id).populate('assignedTo', 'name');
  if (!t) throw ApiError.notFound('Ticket not found');
  return t;
}

export async function staffReply(actor, id, { text, internal }, req) {
  const t = await SupportTicket.findById(id);
  if (!t) throw ApiError.notFound('Ticket not found');
  if (t.status === 'closed') throw ApiError.conflict('This ticket is closed');
  t.messages.push({ by: actor._id, byName: actor.name, side: 'staff', text, internal: Boolean(internal) });
  t.lastActivityAt = new Date();
  if (!internal && t.status === 'open') t.status = 'in_progress';
  await t.save();
  if (!internal) {
    if (t.user) await notify(t.user, { type: 'ticket.reply', title: 'New reply on your support ticket', body: `${t.code}: ${text.slice(0, 120)}`, link: '/dashboard/support' });
    await emailRequester(t, { subject: `Reply to your request (${t.code})`, lines: [text], path: t.user ? '/dashboard/support' : '/support' });
  }
  await logAudit({ req, action: internal ? 'ticket.note' : 'ticket.replied', entity: 'SupportTicket', entityId: t._id });
  return getForStaff(id);
}

export async function assign(actor, id, assigneeId, req) {
  const assignee = await User.findOne({ _id: assigneeId, isActive: true, deletedAt: null });
  if (!assignee || !STAFF_ROLES.includes(assignee.role)) throw ApiError.badRequest('Tickets can only be assigned to active staff');
  const t = await SupportTicket.findByIdAndUpdate(id, { $set: { assignedTo: assignee._id, lastActivityAt: new Date() } }, { new: true });
  if (!t) throw ApiError.notFound('Ticket not found');
  await logAudit({ req, action: 'ticket.assigned', entity: 'SupportTicket', entityId: t._id, metadata: { to: assignee.name } });
  return getForStaff(id);
}

export async function setStatus(actor, id, status, req) {
  const t = await SupportTicket.findById(id);
  if (!t) throw ApiError.notFound('Ticket not found');
  if (!canTicketTransition(t.status, status)) throw ApiError.conflict(`A ${t.status.replace('_', ' ')} ticket cannot become ${status.replace('_', ' ')}`, { code: 'INVALID_TRANSITION' });
  t.status = status;
  t.lastActivityAt = new Date();
  if (status === 'resolved') t.resolvedAt = new Date();
  await t.save();
  if (['resolved', 'closed'].includes(status)) {
    if (t.user) await notify(t.user, { type: `ticket.${status}`, title: `Your ticket was ${status}`, body: `${t.code}: ${t.subject}`, link: '/dashboard/support' });
    await emailRequester(t, { subject: `Your request ${t.code} was ${status}`, lines: [`Ticket "${t.subject}" is now ${status}. If your problem is not solved, reply on the ticket.`], path: t.user ? '/dashboard/support' : '/support' });
  }
  await logAudit({ req, action: `ticket.${status}`, entity: 'SupportTicket', entityId: t._id });
  return getForStaff(id);
}

export async function setPriority(actor, id, priority, req) {
  const t = await SupportTicket.findByIdAndUpdate(id, { $set: { priority } }, { new: true });
  if (!t) throw ApiError.notFound('Ticket not found');
  await logAudit({ req, action: 'ticket.priority_changed', entity: 'SupportTicket', entityId: t._id, metadata: { priority } });
  return getForStaff(id);
}
