import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUserAgent, referrerHost } from '../src/utils/userAgent.js';
import { dueReminderKind } from '../src/utils/reminders.js';

const CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

test('user agent classification', () => {
  assert.deepEqual(parseUserAgent(CHROME_WIN), { isBot: false, device: 'desktop', browser: 'Chrome' });
  assert.deepEqual(parseUserAgent(IPHONE), { isBot: false, device: 'mobile', browser: 'Safari' });
  assert.equal(parseUserAgent(ANDROID_TABLET).device, 'tablet');
});
test('bots, crawlers, scripts and empty agents are ignored', () => {
  for (const ua of ['Googlebot/2.1', 'Mozilla/5.0 (compatible; bingbot/2.0)', 'curl/8.0', 'python-requests/2.31', 'HeadlessChrome/120', '']) assert.equal(parseUserAgent(ua).isBot, true, ua);
});
test('referrer reduced to a host; own site dropped; garbage ignored', () => {
  assert.equal(referrerHost('https://www.facebook.com/some/path?x=1', 'https://hostel.example'), 'www.facebook.com');
  assert.equal(referrerHost('https://hostel.example/rooms', 'https://hostel.example'), '');
  assert.equal(referrerHost('not a url', 'https://hostel.example'), '');
  assert.equal(referrerHost('', 'x'), '');
});

const now = new Date('2026-09-21T09:00:00Z');
const due = (o) => ({ isVoid: false, status: 'due', amount: 5000, paidAmount: 0, dueDate: new Date('2026-09-23T00:00:00Z'), lastReminderAt: null, ...o });
test('due reminders: upcoming once, overdue weekly, never for paid or void', () => {
  assert.equal(dueReminderKind(due({}), now), 'upcoming');
  assert.equal(dueReminderKind(due({ lastReminderAt: new Date('2026-09-20T09:00:00Z') }), now), null, 'already reminded');
  assert.equal(dueReminderKind(due({ dueDate: new Date('2026-09-30T00:00:00Z') }), now), null, 'not due within 3 days');
  assert.equal(dueReminderKind(due({ dueDate: new Date('2026-09-10T00:00:00Z'), status: 'overdue' }), now), 'overdue');
  assert.equal(dueReminderKind(due({ dueDate: new Date('2026-09-10T00:00:00Z'), lastReminderAt: new Date('2026-09-18T09:00:00Z') }), now), null, 'weekly cadence');
  assert.equal(dueReminderKind(due({ dueDate: new Date('2026-09-10T00:00:00Z'), lastReminderAt: new Date('2026-09-10T09:00:00Z') }), now), 'overdue');
  assert.equal(dueReminderKind(due({ paidAmount: 5000, status: 'paid' }), now), null);
  assert.equal(dueReminderKind(due({ isVoid: true, status: 'void' }), now), null);
  assert.equal(dueReminderKind(due({ paidAmount: 4999.999 }), now), null, 'float noise is not a balance');
});
