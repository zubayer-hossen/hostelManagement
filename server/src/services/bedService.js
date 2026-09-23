import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { computeAvailability } from '../utils/roomUtils.js';

/** Recomputes a room's free-bed count and public badge from the Bed collection (the source of truth). */
export async function syncRoomCounts(roomId) {
  const room = await Room.findById(roomId).select('status capacity');
  if (!room) return null;
  const availableBeds = await Bed.countDocuments({ room: roomId, status: 'available' });
  const availabilityStatus = computeAvailability({ status: room.status, capacity: room.capacity, availableBeds });
  await Room.updateOne({ _id: roomId }, { $set: { availableBeds, availabilityStatus } });
  return { availableBeds, availabilityStatus };
}

/**
 * THE double-booking guard. One atomic update: only a bed that is still 'available' can be reserved,
 * and only one concurrent caller can succeed. Pass `bedId` to reserve a specific bed, otherwise the
 * lowest-labelled free bed of the room is taken. Returns the bed, or null if nothing was free.
 */
export function reserveBed({ roomId, bedId, bookingId }) {
  const filter = bedId ? { _id: bedId, status: 'available' } : { room: roomId, status: 'available' };
  return Bed.findOneAndUpdate(filter, { $set: { status: 'reserved', booking: bookingId } }, { new: true, sort: { label: 1 } });
}

/** Frees a bed, but only if it is still held by this booking (never frees someone else's bed). */
export const releaseBed = (bedId, bookingId) =>
  Bed.updateOne(
    { _id: bedId, booking: bookingId, status: { $in: ['reserved', 'occupied'] } },
    { $set: { status: 'available', booking: null, occupant: null } }
  );
