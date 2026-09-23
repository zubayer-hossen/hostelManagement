/** Bed labels: A, B, C … (max 26). */
export const bedLabel = (index) => String.fromCharCode(65 + index);

/**
 * Public availability badge for a room.
 * - inactive / maintenance come from the room's manual status
 * - fully_booked: no free bed
 * - almost_full: exactly one bed left (in a multi-bed room) or <= 25% free
 */
export function computeAvailability({ status, capacity, availableBeds }) {
  if (status === 'inactive') return 'inactive';
  if (status === 'maintenance') return 'maintenance';
  if (availableBeds <= 0) return 'fully_booked';
  if (capacity > 1 && availableBeds === 1) return 'almost_full';
  if (capacity > 0 && availableBeds / capacity <= 0.25) return 'almost_full';
  return 'available';
}

/** What the public may see about a bed: never who holds it or why. */
export const publicBedStatus = (bedStatus) => (bedStatus === 'available' ? 'available' : bedStatus === 'maintenance' ? 'maintenance' : 'booked');
