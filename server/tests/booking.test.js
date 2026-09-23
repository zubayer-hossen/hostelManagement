import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKING_STATUS as S, ALLOWED_TRANSITIONS, ACTIVE_STATUSES, RELEASING_STATUSES, canTransition, isActiveStatus } from '../src/constants/booking.js';
import { bedLabel, computeAvailability, publicBedStatus } from '../src/utils/roomUtils.js';

test('every status has a transition entry and targets only known statuses', () => {
  const known = new Set(Object.values(S));
  for (const s of known) assert.ok(s in ALLOWED_TRANSITIONS, `${s} missing`);
  for (const targets of Object.values(ALLOWED_TRANSITIONS)) targets.forEach((t) => assert.ok(known.has(t)));
});

test('terminal statuses cannot move anywhere', () => {
  for (const s of [S.REJECTED, S.CANCELLED, S.EXPIRED, S.MOVED_OUT]) {
    assert.equal(ALLOWED_TRANSITIONS[s].length, 0);
    assert.equal(isActiveStatus(s), false);
  }
});

test('the happy path is allowed and shortcuts are not', () => {
  assert.ok(canTransition(S.PENDING, S.APPROVED));
  assert.ok(canTransition(S.APPROVED, S.MOVED_IN));
  assert.ok(canTransition(S.MOVED_IN, S.MOVED_OUT));
  assert.equal(canTransition(S.PENDING, S.MOVED_IN), false, 'must be approved first');
  assert.equal(canTransition(S.REJECTED, S.APPROVED), false);
  assert.equal(canTransition(S.MOVED_IN, S.CANCELLED), false, 'residents move out, not cancel');
});

test('a booking holds a bed exactly while active; releasing statuses are never active', () => {
  for (const s of RELEASING_STATUSES) assert.equal(isActiveStatus(s), false);
  for (const s of ACTIVE_STATUSES) assert.ok(!RELEASING_STATUSES.includes(s));
});

test('bed labels', () => {
  assert.deepEqual([0, 1, 2, 11].map(bedLabel), ['A', 'B', 'C', 'L']);
});

test('availability badge', () => {
  const c = (status, capacity, availableBeds) => computeAvailability({ status, capacity, availableBeds });
  assert.equal(c('active', 4, 4), 'available');
  assert.equal(c('active', 4, 2), 'available');
  assert.equal(c('active', 4, 1), 'almost_full');
  assert.equal(c('active', 8, 2), 'almost_full'); // 25%
  assert.equal(c('active', 2, 1), 'almost_full');
  assert.equal(c('active', 1, 1), 'available');   // a single room with its only bed free is simply available
  assert.equal(c('active', 3, 0), 'fully_booked');
  assert.equal(c('maintenance', 3, 3), 'maintenance');
  assert.equal(c('inactive', 3, 3), 'inactive');
});

test('public bed status never reveals reserved vs occupied', () => {
  assert.equal(publicBedStatus('reserved'), 'booked');
  assert.equal(publicBedStatus('occupied'), 'booked');
  assert.equal(publicBedStatus('available'), 'available');
  assert.equal(publicBedStatus('maintenance'), 'maintenance');
});
