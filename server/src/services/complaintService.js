import crypto from 'node:crypto';
import { Complaint } from '../models/Complaint.js';
import { Resident } from '../models/Resident.js';
import { User } from '../models/User.js';
import { STAFF_ROLES } from '../constants/roles.js';
import { COMPLAINT_TRANSITIONS } from '../constants/resident.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { notify } from './notificationService.js';
import { logAudit } from './auditService.js';

const newCode = () => `CMP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const hidePrivate = (c, staff) => {
  const o = c.toJSON();
  if (!staff) o.notes = o.notes.filter((n) => !n.internal);
  return o;
};
export const serializeComplaint = hidePrivate;

export async function createComplaint(user, data, req) {
  const resident = await Resident.findOne({ user: user._id });
  if (!resident) throw ApiError.forbidden('Only residents can submit complaints');
  for (let attempt = 0; ; attempt += 1) {
    try {
      const c = await Complaint.create({ ...data, code: newCode(), resident: resident._id, user: user._id });
      await logAudit({ req, actor: user, action: 'complaint.created', entity: 'Complaint', entityId: c._id, metadata: { category: c.category } });
      return c;
    } catch (err) {
      if (!(err?.code === 11000 && attempt < 3)) throw err;
    }
  }
}

export const listMine = (userId) => Complaint.find({ user: userId }).sort({ createdAt: -1 }).limit(100);

export async function getFor(id, user, staff) {
  const c = await Complaint.findOne(staff ? { _id: id } : { _id: id, user: user._id }).populate('assignedTo', 'name').populate('resident', 'fullName hostelType');
  if (!c) throw ApiError.notFound('Complaint not found');
  return c;
}

export async function reply(user, id, text) {
  const c = await Complaint.findOne({ _id: id, user: user._id });
  if (!c) throw ApiError.notFound('Complaint not found');
  if (c.status === 'closed') throw ApiError.conflict('This complaint is closed');
  c.notes.push({ by: user._id, byName: user.name, text, internal: false });
  await c.save();
  return c;
}

export async function listAll(q) {
  const f = {};
  for (const k of ['status', 'category', 'priority']) if (q[k]) f[k] = q[k];
  if (q.assignedTo) f.assignedTo = q.assignedTo;
  if (q.search) { const rx = new RegExp(escapeRegex(q.search), 'i'); f.$or = [{ subject: rx }, { code: rx }]; }
  const [items, total] = await Promise.all([
    Complaint.find(f).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('resident', 'fullName hostelType').populate('assignedTo', 'name'),
    Complaint.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

export async function assign(actor, id, assigneeId, req) {
  const assignee = await User.findOne({ _id: assigneeId, isActive: true, deletedAt: null });
  if (!assignee || !STAFF_ROLES.includes(assignee.role)) throw ApiError.badRequest('Complaints can only be assigned to active staff');
  const c = await Complaint.findById(id);
  if (!c) throw ApiError.notFound('Complaint not found');
  if (c.status === 'closed') throw ApiError.conflict('This complaint is closed');
  c.assignedTo = assignee._id;
  if (c.status === 'open') c.status = 'assigned';
  await c.save();
  await notify(c.user, { type: 'complaint.assigned', title: 'Your complaint is being handled', body: `${c.code}: ${c.subject}`, link: '/dashboard/complaints' });
  await logAudit({ req, action: 'complaint.assigned', entity: 'Complaint', entityId: c._id, metadata: { to: assignee.name } });
  return getFor(id, actor, true);
}

export async function setStatus(actor, id, status, req) {
  const c = await Complaint.findById(id);
  if (!c) throw ApiError.notFound('Complaint not found');
  if (!(COMPLAINT_TRANSITIONS[c.status] || []).includes(status)) throw ApiError.conflict(`A ${c.status.replace('_', ' ')} complaint cannot become ${status.replace('_', ' ')}`, { code: 'INVALID_TRANSITION' });
  c.status = status;
  if (status === 'resolved') c.resolvedAt = new Date();
  await c.save();
  await notify(c.user, { type: `complaint.${status}`, title: `Complaint ${status.replace('_', ' ')}`, body: `${c.code}: ${c.subject}`, link: '/dashboard/complaints' });
  await logAudit({ req, action: `complaint.${status}`, entity: 'Complaint', entityId: c._id });
  return getFor(id, actor, true);
}

export async function addNote(actor, id, { text, internal }) {
  const c = await Complaint.findById(id);
  if (!c) throw ApiError.notFound('Complaint not found');
  c.notes.push({ by: actor._id, byName: actor.name, text, internal: Boolean(internal) });
  await c.save();
  if (!internal) await notify(c.user, { type: 'complaint.reply', title: 'New reply on your complaint', body: `${c.code}: ${text.slice(0, 120)}`, link: '/dashboard/complaints' });
  return getFor(id, actor, true);
}
