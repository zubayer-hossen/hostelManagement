export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  ON_HOLD: 'on_hold',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  MOVED_IN: 'moved_in',
  MOVED_OUT: 'moved_out',
});

export const BOOKING_STATUS_LIST = Object.values(BOOKING_STATUS);
const S = BOOKING_STATUS;

/** Statuses in which a booking still holds a bed (reserved or occupied). */
export const ACTIVE_STATUSES = [S.PENDING, S.ON_HOLD, S.APPROVED, S.MOVED_IN];

/** Status -> statuses it may move to. Anything not listed is terminal. */
export const ALLOWED_TRANSITIONS = Object.freeze({
  [S.PENDING]: [S.APPROVED, S.REJECTED, S.ON_HOLD, S.CANCELLED, S.EXPIRED],
  [S.ON_HOLD]: [S.APPROVED, S.REJECTED, S.CANCELLED],
  [S.APPROVED]: [S.MOVED_IN, S.CANCELLED],
  [S.MOVED_IN]: [S.MOVED_OUT],
  [S.REJECTED]: [],
  [S.CANCELLED]: [],
  [S.EXPIRED]: [],
  [S.MOVED_OUT]: [],
});

/** Moving to one of these frees the bed. */
export const RELEASING_STATUSES = [S.REJECTED, S.CANCELLED, S.EXPIRED, S.MOVED_OUT];

export const MAX_ACTIVE_BOOKINGS = 2;

export const canTransition = (from, to) => (ALLOWED_TRANSITIONS[from] || []).includes(to);
export const isActiveStatus = (status) => ACTIVE_STATUSES.includes(status);
