/** Pure helpers for meeting slots. Dates are calendar strings "YYYY-MM-DD", times are "HH:MM" in the hostel's local time. */
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const pad = (n) => String(n).padStart(2, '0');

export const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
export const isValidTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** ["10:00","10:30",…] — a slot must END by endTime. */
export function generateSlots({ startTime, endTime, slotMinutes }) {
  const out = [];
  for (let m = toMin(startTime); m + slotMinutes <= toMin(endTime); m += slotMinutes) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}

/** 0 = Sunday … 6 = Saturday for a calendar date. */
export const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** The real instant of a local slot: local time minus the UTC offset (Bangladesh = +360 min, no daylight saving). */
export const slotStartsAt = (date, time, utcOffsetMinutes) => new Date(Date.parse(`${date}T${time}:00Z`) - utcOffsetMinutes * 60000);

/** Today's calendar date in the hostel's local time. */
export const localToday = (now, utcOffsetMinutes) => new Date(now.getTime() + utcOffsetMinutes * 60000).toISOString().slice(0, 10);

export function slotProblem({ date, time }, cfg, now = new Date()) {
  if (!cfg.enabled) return 'Meeting booking is currently closed';
  if (!isValidDate(date) || !isValidTime(time)) return 'Invalid date or time';
  if (!cfg.days.includes(weekday(date))) return 'The manager is not available on that day';
  if (cfg.blackoutDates.includes(date)) return 'That date is not available';
  if (!generateSlots(cfg).includes(time)) return 'That time is outside the available hours';
  const starts = slotStartsAt(date, time, cfg.utcOffsetMinutes);
  if (starts.getTime() <= now.getTime() + 60 * 60000) return 'Please choose a time at least one hour from now';
  if (starts.getTime() > now.getTime() + cfg.maxAdvanceDays * 864e5) return `Meetings can be booked up to ${cfg.maxAdvanceDays} days ahead`;
  return null;
}
