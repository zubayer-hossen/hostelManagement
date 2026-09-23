#!/usr/bin/env node
/**
 * Double-booking race test (needs a running server + seeded DB).
 * Fires the SAME room request from several different users at the same instant.
 * A room with N free beds must produce exactly N x 201 and the rest 409 (ROOM_FULL).
 *
 *   node scripts/double-booking-check.mjs http://localhost:5000/api/v1 <roomId> <token1,token2,token3,...>
 *
 * Tokens = access tokens of DIFFERENT general users (log in as each, copy data.accessToken).
 * Tip: use a single-bed room ("single" type) and 5+ tokens; exactly one must win.
 * Afterwards cancel the test bookings from the dashboard to free the bed.
 */
const [, , api, roomId, tokenList] = process.argv;
if (!api || !roomId || !tokenList) { console.error('usage: node double-booking-check.mjs <apiUrl> <roomId> <token1,token2,...>'); process.exit(1); }

const tokens = tokenList.split(',').map((t) => t.trim()).filter(Boolean);
const day = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

const room = (await (await fetch(`${api}/rooms/${roomId}`)).json()).data;
const gender = room.hostelType === 'boys' ? 'male' : 'female';
console.log(`Room ${room.roomNumber} (${room.hostelType}) free beds before: ${room.availableBeds}. Sending ${tokens.length} simultaneous requests…`);

const results = await Promise.all(tokens.map(async (token, i) => {
  const res = await fetch(`${api}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roomId, fullName: `Race Tester ${i + 1}`, phone: '01700000000', gender, expectedMoveIn: day }),
  });
  const body = await res.json();
  return { status: res.status, code: body.code };
}));

const won = results.filter((r) => r.status === 201).length;
const full = results.filter((r) => r.status === 409 && r.code === 'ROOM_FULL').length;
const after = (await (await fetch(`${api}/rooms/${roomId}`)).json()).data;
console.log({ won, roomFull: full, other: results.length - won - full, freeBedsAfter: after.availableBeds });
const expected = Math.min(room.availableBeds, tokens.length);
console.log(won === expected ? `PASS: exactly ${expected} request(s) won` : `FAIL: expected ${expected} winner(s), got ${won}`);
process.exit(won === expected ? 0 : 2);
