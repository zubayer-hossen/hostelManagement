import { Booking } from '../models/Booking.js';
import { releaseBed, syncRoomCounts } from './bedService.js';

let lastRun = 0;

/**
 * Expires PENDING requests whose hold time ran out and frees their beds.
 * Runs lazily (at most once a minute) whenever rooms are listed or a booking is made,
 * so it works without a scheduler. Phase 7/8 adds a cron job that calls it too.
 */
export async function expireStaleBookings({ force = false } = {}) {
  if (!force && Date.now() - lastRun < 60 * 1000) return 0;
  lastRun = Date.now();

  const stale = await Booking.find({ status: 'pending', holdExpiresAt: { $ne: null, $lt: new Date() } }).select('_id bed room').limit(200);
  let expired = 0;
  for (const b of stale) {
    // updateOne bypasses the pre-validate hook, so the hold flag is cleared explicitly (it backs the unique index).
    const res = await Booking.updateOne(
      { _id: b._id, status: 'pending' },
      { $set: { status: 'expired', isActiveHold: false, decidedAt: new Date(), decisionReason: 'Request expired automatically' } }
    );
    if (res.modifiedCount) {
      if (b.bed) await releaseBed(b.bed, b._id);
      await syncRoomCounts(b.room);
      expired += 1;
    }
  }
  return expired;
}
