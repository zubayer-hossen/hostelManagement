import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Due } from '../models/Due.js';
import { Payment } from '../models/Payment.js';
import { Resident } from '../models/Resident.js';
import { RESIDENT_STATUS } from '../constants/resident.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { round2, computeDueStatus, EPS } from '../utils/money.js';
import { notify } from './notificationService.js';
import { logAudit } from './auditService.js';

const money = (n) => `৳ ${n.toLocaleString('en-US')}`;

async function recomputeDueStatus(dueId) {
  const due = await Due.findById(dueId);
  if (!due || due.isVoid) return null;
  const status = computeDueStatus(due);
  if (status !== due.status) await Due.updateOne({ _id: dueId, isVoid: false }, { $set: { status } });
  return status;
}

let lastOverdueRun = 0;
/** Lazily flips unpaid dues past their date to "overdue" (a scheduled job also calls this from Phase 7/8). */
export async function markOverdue({ force = false } = {}) {
  if (!force && Date.now() - lastOverdueRun < 60 * 1000) return;
  lastOverdueRun = Date.now();
  await Due.updateMany({ isVoid: false, status: 'due', dueDate: { $lt: new Date() } }, { $set: { status: 'overdue' } });
}

export async function getOutstanding(residentId) {
  const rows = await Due.aggregate([
    { $match: { resident: new mongoose.Types.ObjectId(String(residentId)), isVoid: false } },
    { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } },
  ]);
  return round2(Math.max(0, rows[0]?.total ?? 0));
}

export async function outstandingMap(residentIds) {
  const rows = await Due.aggregate([
    { $match: { resident: { $in: residentIds }, isVoid: false } },
    { $group: { _id: '$resident', total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), round2(Math.max(0, r.total))]));
}

// ── dues ──
export async function generateRent(actor, { month, year, dueDay }, req) {
  const end = new Date(year, month, 0, 23, 59, 59);
  const dueDate = new Date(year, month - 1, dueDay, 23, 59, 59);
  const residents = await Resident.find({
    status: { $in: [RESIDENT_STATUS.PENDING, RESIDENT_STATUS.VERIFIED] },
    room: { $ne: null }, monthlyRent: { $gt: 0 }, 'moveOut.status': { $ne: 'completed' },
    $or: [{ joiningDate: null }, { joiningDate: { $lte: end } }],
  }).select('user monthlyRent fullName');

  let created = 0;
  let skipped = 0;
  for (const r of residents) {
    try {
      await Due.create({ resident: r._id, user: r.user, type: 'rent', month, year, amount: r.monthlyRent, description: `Rent ${month}/${year}`, dueDate, createdBy: actor._id });
      created += 1;
      await notify(r.user, { type: 'due.created', title: 'Rent due', body: `${money(r.monthlyRent)} for ${month}/${year}`, link: '/dashboard/resident/payments' });
    } catch (err) {
      if (err?.code === 11000) skipped += 1; else throw err; // already generated for this month
    }
  }
  await logAudit({ req, action: 'due.rent_generated', entity: 'Due', entityId: `${year}-${month}`, metadata: { created, skipped } });
  return { created, skipped, residents: residents.length };
}

export async function createDue(actor, data, req) {
  const resident = await Resident.findById(data.residentId);
  if (!resident) throw ApiError.notFound('Resident not found');
  try {
    const due = await Due.create({ resident: resident._id, user: resident.user, type: data.type, month: data.month, year: data.year, amount: round2(data.amount), description: data.description || '', dueDate: data.dueDate, createdBy: actor._id });
    await notify(resident.user, { type: 'due.created', title: 'New charge added', body: `${money(due.amount)} — ${due.description || due.type}`, link: '/dashboard/resident/payments' });
    await logAudit({ req, action: 'due.created', entity: 'Due', entityId: due._id, metadata: { type: due.type, amount: due.amount } });
    return due;
  } catch (err) {
    if (err?.code === 11000) throw ApiError.conflict('A rent due for this resident and month already exists');
    throw err;
  }
}

export async function voidDue(actor, id, reason, req) {
  const due = await Due.findOneAndUpdate(
    { _id: id, isVoid: false, paidAmount: 0 },
    { $set: { isVoid: true, status: 'void', voidedAt: new Date(), voidedBy: actor._id, voidReason: reason || '' } },
    { new: true }
  );
  if (!due) {
    const exists = await Due.findById(id);
    if (!exists) throw ApiError.notFound('Due not found');
    throw ApiError.conflict(exists.isVoid ? 'This due is already void' : 'Payments exist on this due. Void the payments first.');
  }
  await logAudit({ req, action: 'due.voided', entity: 'Due', entityId: due._id, metadata: { reason } });
  return due;
}

const dueFilter = async (q) => {
  const f = {};
  if (q.status) f.status = q.status;
  if (q.residentId) f.resident = q.residentId;
  if (q.month) f.month = q.month;
  if (q.year) f.year = q.year;
  if (q.type) f.type = q.type;
  if (q.search) {
    const ids = await Resident.find({ fullName: new RegExp(escapeRegex(q.search), 'i') }).select('_id').limit(200);
    f.resident = { $in: ids.map((r) => r._id) };
  }
  return f;
};

export async function listDues(q) {
  await markOverdue();
  const filter = await dueFilter(q);
  const [items, total] = await Promise.all([
    Due.find(filter).sort({ year: -1, month: -1, createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('resident', 'fullName hostelType'),
    Due.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

export async function listMyDues(userId) {
  await markOverdue();
  return Due.find({ user: userId }).sort({ year: -1, month: -1, createdAt: -1 }).limit(100);
}

// ── payments ──
const newReceiptNo = () => `RCPT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Records a payment against a due. The overpayment check and the increment are ONE atomic update,
 * so two simultaneous payments can never push paidAmount above the amount.
 */
export async function recordPayment(actor, { dueId, amount, method, transactionId, paidAt, note }, req) {
  const value = round2(amount);
  const due = await Due.findOneAndUpdate(
    { _id: dueId, isVoid: false, $expr: { $lte: [{ $add: ['$paidAmount', value] }, { $add: ['$amount', EPS] }] } },
    { $inc: { paidAmount: value } },
    { new: true }
  );
  if (!due) {
    const exists = await Due.findById(dueId);
    if (!exists || exists.isVoid) throw ApiError.notFound('Due not found');
    throw ApiError.conflict(`Amount is more than the outstanding balance (${money(round2(exists.amount - exists.paidAmount))})`, { code: 'OVERPAYMENT' });
  }

  let payment;
  try {
    for (let attempt = 0; ; attempt += 1) {
      try {
        payment = await Payment.create({ receiptNo: newReceiptNo(), due: due._id, resident: due.resident, user: due.user, amount: value, method, transactionId, paidAt: paidAt || new Date(), note, recordedBy: actor._id });
        break;
      } catch (err) {
        if (!(err?.code === 11000 && attempt < 3)) throw err; // receipt number collision: retry
      }
    }
  } catch (err) {
    await Due.updateOne({ _id: due._id }, { $inc: { paidAmount: -value } }); // roll back
    throw err;
  }

  await recomputeDueStatus(due._id);
  await notify(due.user, { type: 'payment.received', title: 'Payment received', body: `${money(value)} — receipt ${payment.receiptNo}`, link: '/dashboard/resident/payments' }, { email: true });
  await logAudit({ req, action: 'payment.recorded', entity: 'Payment', entityId: payment._id, metadata: { amount: value, method, due: String(due._id) } });
  return payment;
}

export async function voidPayment(actor, id, reason, req) {
  const payment = await Payment.findOneAndUpdate(
    { _id: id, status: 'recorded' },
    { $set: { status: 'voided', voidedAt: new Date(), voidedBy: actor._id, voidReason: reason || '' } },
    { new: true }
  );
  if (!payment) throw ApiError.conflict('Payment not found or already voided');
  await Due.updateOne({ _id: payment.due }, { $inc: { paidAmount: -payment.amount } });
  await recomputeDueStatus(payment.due);
  await notify(payment.user, { type: 'payment.voided', title: 'A payment was reversed', body: `${money(payment.amount)} — ${payment.receiptNo}`, link: '/dashboard/resident/payments' });
  await logAudit({ req, action: 'payment.voided', entity: 'Payment', entityId: payment._id, metadata: { reason, amount: payment.amount } });
  return payment;
}

export async function listPayments(q) {
  const f = {};
  if (q.residentId) f.resident = q.residentId;
  if (q.method) f.method = q.method;
  if (q.status) f.status = q.status;
  if (q.from || q.to) f.paidAt = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };
  const [items, total] = await Promise.all([
    Payment.find(f).sort({ paidAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('resident', 'fullName').populate('recordedBy', 'name'),
    Payment.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

export const listMyPayments = (userId) => Payment.find({ user: userId }).sort({ paidAt: -1 }).limit(100);

/** Numbers for staff dashboards. */
export async function getSummary() {
  await markOverdue();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [outstanding, collected, overdue] = await Promise.all([
    Due.aggregate([{ $match: { isVoid: false } }, { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }]),
    Payment.aggregate([{ $match: { status: 'recorded', paidAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Due.countDocuments({ isVoid: false, status: 'overdue' }),
  ]);
  return { totalOutstanding: round2(outstanding[0]?.total ?? 0), collectedThisMonth: round2(collected[0]?.total ?? 0), overdueCount: overdue };
}
