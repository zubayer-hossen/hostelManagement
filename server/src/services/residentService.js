import { Resident } from '../models/Resident.js';
import { Bed } from '../models/Bed.js';
import { Booking } from '../models/Booking.js';
import { OccupancyRecord } from '../models/OccupancyRecord.js';
import { Notice } from '../models/Notice.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { RESIDENT_STATUS as RS, MOVE_OUT, DEFAULT_REQUIRED_FIELDS, canVerifyTransition, missingFields } from '../constants/resident.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { activeWindow } from '../utils/schemaOptions.js';
import { syncRoomCounts } from './bedService.js';
import { getOutstanding, outstandingMap } from './financeService.js';
import { notify } from './notificationService.js';
import { logAudit } from './auditService.js';

export async function getRequiredFields() {
  const s = await SiteSetting.findOne({ key: 'main' }).select('residentForm').lean();
  return s?.residentForm?.requiredFields ?? DEFAULT_REQUIRED_FIELDS;
}

const stayPopulate = (q) => q.populate('room', 'roomNumber floor roomType hostelType price').populate('bed', 'label');

/** Called at move-in: creates the resident record (or re-activates a returning resident). */
export async function ensureResidentForBooking(booking, joiningDate) {
  const required = await getRequiredFields();
  let resident = await Resident.findOne({ user: booking.user });
  const stay = {
    status: RS.PENDING, hostelType: booking.hostelType, room: booking.room, bed: booking.bed, booking: booking._id,
    monthlyRent: booking.monthlyRate, joiningDate, leftAt: null, moveOut: { status: MOVE_OUT.NONE },
    expectedLeavingDate: null, verifiedBy: null, verifiedAt: null, verificationNote: '',
  };
  if (resident) {
    resident.set(stay);
  } else {
    resident = new Resident({
      user: booking.user, ...stay, fullName: booking.fullName, gender: booking.gender, phone: booking.phone,
      email: booking.email, occupation: booking.occupation, institution: booking.institution,
    });
  }
  resident.profileCompleted = missingFields(resident, required).length === 0;
  await resident.save();
  return resident;
}

/** Called after a successful move-out. History stays; the current stay is cleared. */
export async function onCheckOut(booking, when) {
  await Resident.updateOne(
    { user: booking.user },
    { $set: { status: RS.ARCHIVED, room: null, bed: null, leftAt: when, 'moveOut.status': MOVE_OUT.COMPLETED, 'moveOut.completedAt': when } }
  );
  await notify(booking.user, { type: 'resident.moved_out', title: 'Move-out completed', body: 'Your stay has been closed. Thank you for staying with us.' });
}

// ── resident (self) ──
async function ownResident(userId) {
  const r = await Resident.findOne({ user: userId });
  if (!r) throw ApiError.notFound('You do not have a resident profile yet');
  return r;
}

export async function getMine(userId) {
  const resident = await stayPopulate(Resident.findOne({ user: userId }));
  if (!resident) throw ApiError.notFound('You do not have a resident profile yet');
  const required = await getRequiredFields();
  return { resident, outstanding: await getOutstanding(resident._id), requiredFields: required, missingFields: missingFields(resident, required) };
}

export async function updateMine(userId, data) {
  const resident = await ownResident(userId);
  if (resident.status === RS.ARCHIVED) throw ApiError.conflict('This profile is archived');
  resident.set(data);
  const required = await getRequiredFields();
  resident.profileCompleted = missingFields(resident, required).length === 0;
  await resident.save();
  return getMine(userId);
}

export async function acknowledgeRules(userId) {
  const resident = await ownResident(userId);
  resident.rulesAcknowledgedAt = new Date();
  await resident.save();
  return resident;
}

/** Notices meant for residents (audience "residents" + everyone + their own hostel), which the public site never shows. */
export async function residentNotices(userId) {
  const resident = await ownResident(userId);
  const now = new Date();
  return Notice.find({
    ...activeWindow('publishAt', 'expiresAt', now),
    audience: { $in: ['everyone', 'residents', resident.hostelType] },
  }).sort({ isPinned: -1, publishAt: -1 }).limit(30);
}

export async function requestMoveOut(userId, { date, reason }) {
  const resident = await ownResident(userId);
  if (!resident.room || resident.status === RS.ARCHIVED) throw ApiError.conflict('You do not have an active stay');
  if ([MOVE_OUT.REQUESTED, MOVE_OUT.APPROVED].includes(resident.moveOut.status)) throw ApiError.conflict('A move-out request is already in progress');
  resident.moveOut = { status: MOVE_OUT.REQUESTED, requestedAt: new Date(), requestedDate: date, reason: reason || '' };
  await resident.save();
  return resident;
}

// ── staff ──
export async function listResidents(q) {
  const f = {};
  if (q.status) f.status = q.status;
  if (q.hostelType) f.hostelType = q.hostelType;
  if (q.room) f.room = q.room;
  if (q.moveOut) f['moveOut.status'] = q.moveOut;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    f.$or = [{ fullName: rx }, { phone: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    stayPopulate(Resident.find(f).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)),
    Resident.countDocuments(f),
  ]);
  const owed = await outstandingMap(items.map((r) => r._id));
  let list = items.map((r) => ({ ...r.toJSON(), outstanding: owed.get(String(r._id)) ?? 0 }));
  if (q.hasDue === true) list = list.filter((r) => r.outstanding > 0);
  return { items: list, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

export async function getResident(id) {
  const resident = await stayPopulate(Resident.findById(id));
  if (!resident) throw ApiError.notFound('Resident not found');
  const required = await getRequiredFields();
  return { ...resident.toJSON(), outstanding: await getOutstanding(resident._id), missingFields: missingFields(resident, required) };
}

export async function verify(actor, id, { status, note }, req) {
  const resident = await Resident.findById(id);
  if (!resident) throw ApiError.notFound('Resident not found');
  if (!canVerifyTransition(resident.status, status)) throw ApiError.conflict(`A ${resident.status} resident cannot become ${status}`, { code: 'INVALID_TRANSITION' });
  if (status === RS.VERIFIED && !resident.profileCompleted) throw ApiError.conflict('The resident has not completed the required profile fields yet', { code: 'PROFILE_INCOMPLETE' });

  const from = resident.status;
  resident.status = status;
  resident.verifiedBy = actor._id;
  resident.verifiedAt = new Date();
  resident.verificationNote = note || '';
  await resident.save();
  await notify(resident.user, { type: `resident.${status}`, title: `Your resident profile is ${status}`, body: note || '', link: '/dashboard/resident/profile' });
  await logAudit({ req, action: `resident.${status}`, entity: 'Resident', entityId: resident._id, metadata: { from, note } });
  return getResident(id);
}

/** Moves an occupying resident to another free bed (same hostel type). New bed is taken atomically first. */
export async function transfer(actor, id, { bedId, reason }, req) {
  const resident = await Resident.findById(id);
  if (!resident || !resident.bed || !resident.booking) throw ApiError.conflict('This resident has no active bed');
  if (resident.moveOut.status === MOVE_OUT.COMPLETED || resident.status === RS.ARCHIVED) throw ApiError.conflict('This resident has already left');
  if (String(resident.bed) === String(bedId)) throw ApiError.badRequest('The resident already sleeps in this bed');

  const target = await Bed.findById(bedId).populate('room');
  if (!target?.room || target.room.archivedAt || target.room.status !== 'active') throw ApiError.notFound('Bed not found or room not open');
  if (target.room.hostelType !== resident.hostelType) throw ApiError.badRequest('The bed must be in the same hostel type');

  const taken = await Bed.findOneAndUpdate({ _id: bedId, status: 'available' }, { $set: { status: 'occupied', booking: resident.booking, occupant: resident.user } }, { new: true });
  if (!taken) throw ApiError.conflict('That bed is no longer available', { code: 'BED_TAKEN' });

  const oldBed = resident.bed;
  const oldRoom = resident.room;
  const now = new Date();
  try {
    await Booking.updateOne({ _id: resident.booking }, { $set: { bed: taken._id, room: target.room._id, monthlyRate: target.room.price } });
  } catch (err) {
    await Bed.updateOne({ _id: taken._id }, { $set: { status: 'available', booking: null, occupant: null } });
    throw err;
  }
  await Bed.updateOne({ _id: oldBed, occupant: resident.user }, { $set: { status: 'available', booking: null, occupant: null } });
  await OccupancyRecord.updateOne({ booking: resident.booking, endDate: null }, { $set: { endDate: now, endReason: `Transferred: ${reason}` } });
  await OccupancyRecord.create({ user: resident.user, room: target.room._id, bed: taken._id, booking: resident.booking, startDate: now });
  await Resident.updateOne({ _id: resident._id }, { $set: { room: target.room._id, bed: taken._id, monthlyRent: target.room.price } });

  await syncRoomCounts(target.room._id);
  if (String(oldRoom) !== String(target.room._id)) await syncRoomCounts(oldRoom);
  await notify(resident.user, { type: 'resident.transferred', title: 'Your room was changed', body: `New room ${target.room.roomNumber}, bed ${taken.label}. ${reason}`, link: '/dashboard' });
  await logAudit({ req, action: 'resident.transferred', entity: 'Resident', entityId: resident._id, metadata: { toRoom: target.room.roomNumber, toBed: taken.label, reason } });
  return getResident(id);
}

export async function decideMoveOut(actor, id, { approve, note }, req) {
  const resident = await Resident.findById(id);
  if (!resident) throw ApiError.notFound('Resident not found');
  if (resident.moveOut.status !== MOVE_OUT.REQUESTED) throw ApiError.conflict('There is no pending move-out request');
  resident.moveOut.status = approve ? MOVE_OUT.APPROVED : MOVE_OUT.REJECTED;
  resident.moveOut.decidedBy = actor._id;
  resident.moveOut.decidedAt = new Date();
  resident.moveOut.decisionNote = note || '';
  await resident.save();
  const outstanding = await getOutstanding(resident._id);
  await notify(resident.user, {
    type: approve ? 'moveout.approved' : 'moveout.rejected',
    title: approve ? 'Move-out approved' : 'Move-out request declined',
    body: approve && outstanding > 0 ? `Please clear your outstanding balance of ৳ ${outstanding} before leaving. ${note || ''}` : note || '',
    link: '/dashboard/resident',
  });
  await logAudit({ req, action: approve ? 'resident.moveout_approved' : 'resident.moveout_rejected', entity: 'Resident', entityId: resident._id, metadata: { outstanding } });
  return { ...(await getResident(id)), finalOutstanding: outstanding };
}

