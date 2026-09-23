import test from 'node:test';
import assert from 'node:assert/strict';
import { TICKET_STATUSES, TICKET_TRANSITIONS, canTicketTransition, defaultPriority } from '../src/constants/support.js';

test('every ticket status has transitions; closed is final', () => {
  for (const s of TICKET_STATUSES) assert.ok(s in TICKET_TRANSITIONS);
  assert.equal(TICKET_TRANSITIONS.closed.length, 0);
});
test('tickets can be reopened from resolved but not from closed', () => {
  assert.ok(canTicketTransition('resolved', 'in_progress'));
  assert.equal(canTicketTransition('closed', 'open'), false);
  assert.equal(canTicketTransition('open', 'open'), false);
});
test('emergency tickets start urgent', () => {
  assert.equal(defaultPriority('emergency'), 'urgent');
  assert.equal(defaultPriority('food'), 'normal');
});
