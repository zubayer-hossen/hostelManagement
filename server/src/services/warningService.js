import { Warning } from '../models/Warning.js';
import { Resident } from '../models/Resident.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination } from '../utils/response.js';
import { notify } from './notificationService.js';
import { logAudit } from './auditService.js';

export async function issueWarning(actor, data, req) {
  const resident = await Resident.findById(data.residentId);
  if (!resident) throw ApiError.notFound('Resident not found');
  const w = await Warning.create({ resident: resident._id, user: resident.user, type: data.type, severity: data.severity, reason: data.reason, description: data.description, issuedBy: actor._id });
  await notify(resident.user, { type: 'warning.issued', title: 'You received a warning', body: w.reason, link: '/dashboard/resident/warnings' }, { email: true });
  await logAudit({ req, action: 'warning.issued', entity: 'Warning', entityId: w._id, metadata: { type: w.type, severity: w.severity, resident: String(resident._id) } });
  return w;
}

export const listMine = (userId) => Warning.find({ user: userId, status: { $ne: 'withdrawn' } }).sort({ createdAt: -1 }).limit(100);

export async function acknowledge(userId, id) {
  const w = await Warning.findOneAndUpdate({ _id: id, user: userId, status: 'active' }, { $set: { status: 'acknowledged', acknowledgedAt: new Date() } }, { new: true });
  if (!w) throw ApiError.conflict('Warning not found or already acknowledged');
  return w;
}

export async function listAll(q) {
  const f = {};
  if (q.status) f.status = q.status;
  if (q.residentId) f.resident = q.residentId;
  if (q.severity) f.severity = q.severity;
  const [items, total] = await Promise.all([
    Warning.find(f).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('resident', 'fullName').populate('issuedBy', 'name'),
    Warning.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

/** Closing a warning is a human decision: resolve (issue settled) or withdraw (issued in error). */
export async function close(actor, id, { status, note }, req) {
  const w = await Warning.findOneAndUpdate({ _id: id, status: { $in: ['active', 'acknowledged'] } }, { $set: { status, resolutionNote: note || '', resolvedAt: new Date() } }, { new: true });
  if (!w) throw ApiError.conflict('Warning not found or already closed');
  await notify(w.user, { type: `warning.${status}`, title: `A warning was ${status}`, body: w.reason, link: '/dashboard/resident/warnings' });
  await logAudit({ req, action: `warning.${status}`, entity: 'Warning', entityId: w._id, metadata: { note } });
  return w;
}
