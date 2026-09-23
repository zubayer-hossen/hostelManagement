import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { Booking } from '../models/Booking.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { User } from '../models/User.js';
import { OccupancyRecord } from '../models/OccupancyRecord.js';
import { ROLES } from '../constants/roles.js';
import { BOOKING_STATUS as S, MAX_ACTIVE_BOOKINGS, RELEASING_STATUSES, canTransition } from '../constants/booking.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { reserveBed, releaseBed, syncRoomCounts } from './bedService.js';
import { expireStaleBookings } from './bookingMaintenance.js';
import { logAudit } from './auditService.js';
import { notify } from './notificationService.js';
import { ensureResidentForBooking, onCheckOut } from './residentService.js';
import { getOutstanding } from './financeService.js';
import { Resident } from '../models/Resident.js';

const ROOM_FIELDS = 'roomNumber hostelType floor roomType price imageUrls capacity';
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const requiredGender = (hostelType) => (hostelType === 'boys' ? 'male' : 'female');

/** Hides staff-only data from the person who made the booking. */
export function serializeBooking(booking, { staff }) {
  const o = booking.toJSON();
  if (!staff) { delete o.internalNotes; delete o.decidedBy; }
  return o;
}

const populate = (q, { staff }) => {
  q.populate('room', ROOM_FIELDS).populate('bed', 'label');
  if (staff) q.populate('user', 'name email phone role');
  return q;
};

/**
 * Creates a room request and reserves a bed in ONE atomic step.
 * Identity (user) always comes from the token, never from the request body.
 */
export async function createBooking(user, data, req) {
  await expireStaleBookings({ force: true });

  const room = await Room.findOne({ _id: data.roomId, archivedAt: null });
  if (!room || room.status !== 'active') throw ApiError.conflict('This room is not open for booking right now', { code: 'ROOM_UNAVAILABLE' });
  if (data.gender !== requiredGender(room.hostelType)) {
    throw ApiError.badRequest(`The ${room.hostelType} hostel is for ${requiredGender(room.hostelType)} residents`, { errors: [{ field: 'gender', message: 'Does not match this hostel' }] });
  }

  const active = await Booking.countDocuments({ user: user._id, isActiveHold: true });
  if (active >= MAX_ACTIVE_BOOKINGS) {
    throw ApiError.conflict(`You already have ${MAX_ACTIVE_BOOKINGS} active room requests. Cancel one before requesting another.`, { code: 'TOO_MANY_BOOKINGS' });
  }

  const bookingId = new mongoose.Types.ObjectId();
  const bed = await reserveBed({ roomId: room._id, bookingId });
  if (!bed) {
    await syncRoomCounts(room._id);
    throw ApiError.conflict('Sorry, this room has just become fully booked.', { code: 'ROOM_FULL' });
  }

  let booking;
  try {
    booking = await Booking.create({
      _id: bookingId,
      user: user._id,
      room: room._id,
      bed: bed._id,
      hostelType: room.hostelType,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || user.email,
      gender: data.gender,
      occupation: data.occupation,
      institution: data.institution,
      expectedMoveIn: data.expectedMoveIn,
      notes: data.notes,
      monthlyRate: room.price,
      holdExpiresAt: daysFromNow(config.BOOKING_HOLD_DAYS),
    });
  } catch (err) {
    await releaseBed(bed._id, bookingId); // never leave a bed reserved for a booking that failed to save
    await syncRoomCounts(room._id);
    if (err?.code === 11000) throw ApiError.conflict('You already have an active request for this room', { code: 'DUPLICATE_BOOKING' });
    throw err;
  }

  await syncRoomCounts(room._id);
  await logAudit({ req, actor: user, action: 'booking.requested', entity: 'Booking', entityId: booking._id, metadata: { room: room.roomNumber, hostelType: room.hostelType } });
  return populate(Booking.findById(booking._id), { staff: false });
}

export const listMyBookings = (userId) => populate(Booking.find({ user: userId }).sort({ createdAt: -1 }), { staff: false });

export async function listBookings(q) {
  await expireStaleBookings();
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.hostelType) filter.hostelType = q.hostelType;
  if (q.room) filter.room = q.room;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ fullName: rx }, { phone: rx }, { email: rx }];
  }
  const sortField = q.sort.replace('-', '');
  const sort = { [sortField]: q.sort.startsWith('-') ? -1 : 1 };
  const [items, total] = await Promise.all([
    populate(Booking.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit), { staff: true }),
    Booking.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

/** Staff (manageBookings) can read any booking; everybody else only their own (others get 404, not 403). */
export async function getBookingFor(id, user, isStaff) {
  const filter = isStaff ? { _id: id } : { _id: id, user: user._id };
  const booking = await populate(Booking.findOne(filter), { staff: isStaff });
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
}

async function loadRaw(id) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
}

/**
 * Moves a booking to a new status if the transition is allowed, frees the bed when the new status requires it.
 * The status change itself is a conditional update (`status` must still equal what we read),
 * so two staff members clicking at once cannot both act on the same booking.
 */
async function transition(booking, to, actor, { reason = '', extra = {} } = {}) {
  if (!canTransition(booking.status, to)) {
    throw ApiError.conflict(`A ${booking.status.replace('_', ' ')} booking cannot become ${to.replace('_', ' ')}`, { code: 'INVALID_TRANSITION' });
  }
  const isActive = !RELEASING_STATUSES.includes(to);
  const res = await Booking.updateOne(
    { _id: booking._id, status: booking.status },
    {
      $set: {
        status: to, isActiveHold: isActive, decidedBy: actor?._id ?? null, decidedAt: new Date(),
        ...(reason ? { decisionReason: reason } : {}),
        ...(to === S.APPROVED || to === S.ON_HOLD ? { holdExpiresAt: null } : {}),
        ...extra,
      },
    }
  );
  if (!res.modifiedCount) throw ApiError.conflict('This booking was just changed by someone else. Refresh and try again.', { code: 'STALE_BOOKING' });

  if (RELEASING_STATUSES.includes(to) && booking.bed) {
    await releaseBed(booking.bed, booking._id);
    await syncRoomCounts(booking.room);
  }
}

async function finish(id, staff) {
  return populate(Booking.findById(id), { staff });
}

export async function approve(actor, id, reason, req) {
  const b = await loadRaw(id);
  await transition(b, S.APPROVED, actor, { reason });
  await notify(b.user, { type: 'booking.approved', title: 'Room request approved', body: reason || 'Please contact the hostel office to arrange your move-in.', link: '/dashboard/bookings' }, { email: true });
  await logAudit({ req, action: 'booking.approved', entity: 'Booking', entityId: b._id });
  return finish(id, true);
}

export async function reject(actor, id, reason, req) {
  const b = await loadRaw(id);
  await transition(b, S.REJECTED, actor, { reason });
  await notify(b.user, { type: 'booking.rejected', title: 'Room request declined', body: reason || '', link: '/dashboard/bookings' }, { email: true });
  await logAudit({ req, action: 'booking.rejected', entity: 'Booking', entityId: b._id, metadata: { reason } });
  return finish(id, true);
}

export async function hold(actor, id, reason, req) {
  const b = await loadRaw(id);
  await transition(b, S.ON_HOLD, actor, { reason });
  await notify(b.user, { type: 'booking.on_hold', title: 'Room request on hold', body: reason || 'Your bed stays reserved while we review.', link: '/dashboard/bookings' });
  await logAudit({ req, action: 'booking.on_hold', entity: 'Booking', entityId: b._id });
  return finish(id, true);
}

/** Owner or staff. Frees the bed. */
export async function cancel(actor, id, reason, req, isStaff) {
  const b = await loadRaw(id);
  if (!isStaff && String(b.user) !== String(actor._id)) throw ApiError.notFound('Booking not found');
  await transition(b, S.CANCELLED, actor, { reason });
  if (isStaff && String(b.user) !== String(actor._id)) await notify(b.user, { type: 'booking.cancelled', title: 'Room booking cancelled', body: reason || '', link: '/dashboard/bookings' });
  await logAudit({ req, action: 'booking.cancelled', entity: 'Booking', entityId: b._id, metadata: { by: isStaff ? 'staff' : 'user' } });
  return finish(id, isStaff);
}

export async function addNote(actor, id, text) {
  const booking = await Booking.findByIdAndUpdate(id, { $push: { internalNotes: { by: actor._id, byName: actor.name, text } } }, { new: true });
  if (!booking) throw ApiError.notFound('Booking not found');
  return finish(id, true);
}

/** Staff moves an open booking to another bed (same hostel type). New bed is reserved atomically first. */
export async function assignBed(actor, id, bedId, req) {
  const b = await loadRaw(id);
  if (![S.PENDING, S.ON_HOLD, S.APPROVED].includes(b.status)) throw ApiError.conflict('Only pending, on-hold or approved bookings can be reassigned');
  if (String(b.bed) === String(bedId)) throw ApiError.badRequest('This bed is already assigned');

  const target = await Bed.findById(bedId).populate('room');
  if (!target || !target.room || target.room.archivedAt || target.room.status !== 'active') throw ApiError.notFound('Bed not found or room not open');
  if (target.room.hostelType !== b.hostelType) throw ApiError.badRequest('The bed must be in the same hostel type as the booking');

  const reserved = await reserveBed({ bedId, bookingId: b._id });
  if (!reserved) throw ApiError.conflict('That bed is no longer available', { code: 'BED_TAKEN' });

  const oldBed = b.bed;
  const oldRoom = b.room;
  try {
    await Booking.updateOne({ _id: b._id }, { $set: { bed: reserved._id, room: target.room._id, monthlyRate: target.room.price } });
  } catch (err) {
    await releaseBed(reserved._id, b._id); // roll back: the unique {user, room} index may reject the move
    await syncRoomCounts(target.room._id);
    if (err?.code === 11000) throw ApiError.conflict('The user already has an active booking in that room');
    throw err;
  }
  if (oldBed) await releaseBed(oldBed, b._id);
  await syncRoomCounts(target.room._id);
  if (String(oldRoom) !== String(target.room._id)) await syncRoomCounts(oldRoom);
  await logAudit({ req, action: 'booking.bed_assigned', entity: 'Booking', entityId: b._id, metadata: { bed: reserved.label, room: target.room.roomNumber } });
  return finish(id, true);
}

/** Move-in: approved booking -> the bed becomes occupied, history is opened, the user becomes a Hostel Resident. */
export async function checkIn(actor, id, date, req) {
  const b = await loadRaw(id);
  if (b.status !== S.APPROVED) throw ApiError.conflict('Only approved bookings can be moved in', { code: 'INVALID_TRANSITION' });

  const bed = await Bed.updateOne({ _id: b.bed, booking: b._id, status: 'reserved' }, { $set: { status: 'occupied', occupant: b.user } });
  if (!bed.modifiedCount) throw ApiError.conflict('The reserved bed is not in a valid state. Reassign a bed first.');

  const when = date || new Date();
  try {
    await transition(b, S.MOVED_IN, actor, { extra: { movedInAt: when } });
  } catch (err) {
    await Bed.updateOne({ _id: b.bed }, { $set: { status: 'reserved', occupant: null } }); // roll back
    throw err;
  }
  await OccupancyRecord.create({ user: b.user, room: b.room, bed: b.bed, booking: b._id, startDate: when });
  await User.updateOne({ _id: b.user, role: ROLES.GENERAL_USER }, { $set: { role: ROLES.HOSTEL_RESIDENT } });
  await ensureResidentForBooking(b, when);
  await syncRoomCounts(b.room);
  await notify(b.user, { type: 'booking.moved_in', title: 'Welcome! You have moved in', body: 'Please complete your resident profile.', link: '/dashboard/resident/profile' });
  await logAudit({ req, action: 'booking.moved_in', entity: 'Booking', entityId: b._id });
  return finish(id, true);
}

/** Move-out: frees the bed, closes the occupancy record. Final dues settlement is added in Phase 4. */
export async function checkOut(actor, id, { date, reason, acknowledgeOutstanding }, req) {
  const b = await loadRaw(id);
  const when = date || new Date();
  // Final settlement: unpaid dues block move-out unless staff explicitly acknowledges them.
  const resident = await Resident.findOne({ user: b.user }).select('_id');
  if (resident) {
    const outstanding = await getOutstanding(resident._id);
    if (outstanding > 0 && !acknowledgeOutstanding) {
      throw ApiError.conflict(`The resident still owes ৳ ${outstanding}. Collect it, or confirm that you want to move them out with the balance outstanding.`, { code: 'OUTSTANDING_DUES', errors: [{ field: 'outstanding', message: String(outstanding) }] });
    }
  }
  await transition(b, S.MOVED_OUT, actor, { reason, extra: { movedOutAt: when } });
  await OccupancyRecord.updateOne({ booking: b._id, endDate: null }, { $set: { endDate: when, endReason: reason || 'Moved out' } });

  const stillResident = await Booking.exists({ user: b.user, status: S.MOVED_IN });
  if (!stillResident) await User.updateOne({ _id: b.user, role: ROLES.HOSTEL_RESIDENT }, { $set: { role: ROLES.GENERAL_USER } });
  await onCheckOut(b, when);
  await logAudit({ req, action: 'booking.moved_out', entity: 'Booking', entityId: b._id, metadata: { reason } });
  return finish(id, true);
}
