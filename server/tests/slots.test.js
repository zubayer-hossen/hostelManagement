import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSlots, isValidDate, isValidTime, slotProblem, slotStartsAt, weekday, localToday } from '../src/utils/slots.js';

const cfg = { enabled: true, days: [0, 1, 2, 3, 4], startTime: '10:00', endTime: '12:00', slotMinutes: 30, maxPerSlot: 1, maxAdvanceDays: 30, utcOffsetMinutes: 360, blackoutDates: ['2026-10-01'] };

test('slot generation: last slot must end by the closing time', () => {
  assert.deepEqual(generateSlots(cfg), ['10:00', '10:30', '11:00', '11:30']);
  assert.deepEqual(generateSlots({ startTime: '09:00', endTime: '10:00', slotMinutes: 45 }), ['09:00']);
  assert.deepEqual(generateSlots({ startTime: '10:00', endTime: '10:20', slotMinutes: 30 }), []);
});
test('date and time validation', () => {
  assert.ok(isValidDate('2026-02-28')); assert.equal(isValidDate('2026-02-30'), false); assert.equal(isValidDate('26-1-1'), false);
  assert.ok(isValidTime('09:05')); assert.equal(isValidTime('24:00'), false); assert.equal(isValidTime('9:5'), false);
});
test('weekday and local instant (UTC+6)', () => {
  assert.equal(weekday('2026-09-21'), 1); // Monday
  assert.equal(slotStartsAt('2026-09-21', '10:00', 360).toISOString(), '2026-09-21T04:00:00.000Z');
  assert.equal(localToday(new Date('2026-09-21T19:00:00Z'), 360), '2026-09-22', 'after 18:00 UTC it is already tomorrow in Dhaka');
});
test('slotProblem: closed day, blackout, outside hours, past, too far ahead', () => {
  const now = new Date('2026-09-21T00:00:00Z'); // Monday 06:00 local
  assert.equal(slotProblem({ date: '2026-09-23', time: '10:30' }, cfg, now), null);            // Wednesday
  assert.match(slotProblem({ date: '2026-09-25', time: '10:30' }, cfg, now), /not available on that day/); // Friday
  assert.match(slotProblem({ date: '2026-10-01', time: '10:30' }, cfg, now), /not available/);            // blackout (Thursday)
  assert.match(slotProblem({ date: '2026-09-23', time: '12:00' }, cfg, now), /outside/);
  assert.match(slotProblem({ date: '2026-09-21', time: '10:00' }, cfg, new Date('2026-09-21T03:30:00Z')), /one hour/); // 09:30 local, slot at 10:00
  assert.match(slotProblem({ date: '2026-12-01', time: '10:00' }, cfg, now), /ahead/);
  assert.match(slotProblem({ date: '2026-09-23', time: '10:00' }, { ...cfg, enabled: false }, now), /closed/);
});
