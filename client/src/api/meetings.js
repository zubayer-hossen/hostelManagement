import { api, unwrap } from './client.js';

export const meetingsApi = {
  config: () => unwrap(api.get('/meetings/config')),
  availability: (date) => unwrap(api.get('/meetings/availability', { params: { date } })),
  book: (body) => unwrap(api.post('/meetings', body)),
  mine: () => unwrap(api.get('/meetings/mine')),
  cancel: (id, reason) => unwrap(api.post(`/meetings/${id}/cancel`, { reason })),
  // staff
  list: (params) => unwrap(api.get('/meetings', { params })),
  outcome: (id, status) => unwrap(api.patch(`/meetings/${id}/outcome`, { status })),
};

/**
 * Types offered for booking today. "audio" means a phone call the manager makes to the number on the account.
 * Video rooms are added when the live-meeting (WebRTC) step is built — until then they are not offered.
 */
export const BOOKABLE_TYPES = ['in_person', 'audio'];
export const MEETING_TONE = { confirmed: 'green', cancelled: 'slate', completed: 'primary', no_show: 'red' };

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const localToday = (offsetMinutes) => new Date(Date.now() + offsetMinutes * 60000).toISOString().slice(0, 10);

/** Bookable calendar dates for the picker (open weekdays, not blacked out, within the advance window). */
export function bookableDates(cfg) {
  const today = localToday(cfg.utcOffsetMinutes);
  const out = [];
  for (let i = 0; i <= cfg.maxAdvanceDays; i += 1) {
    const d = addDays(today, i);
    if (cfg.days.includes(new Date(`${d}T00:00:00Z`).getUTCDay()) && !cfg.blackoutDates.includes(d)) out.push(d);
  }
  return out;
}
