import { Visitor, VisitorLifetime } from '../models/Visitor.js';
import { config } from '../config/env.js';
import { parseUserAgent, referrerHost } from '../utils/userAgent.js';
import { localToday } from '../utils/slots.js';
import { getSettings } from './settingsService.js';
import { getConfig } from './meetingService.js';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const isDup = (e) => e?.code === 11000;

/** Records a page view or a keep-alive ping. Bots are ignored; nothing personal is stored. Returns true if recorded. */
export async function record({ visitorId, path, type, referrer, userAgent }) {
  const ua = parseUserAgent(userAgent);
  if (ua.isBot) return false;

  const now = new Date();
  const { utcOffsetMinutes } = await getConfig(); // the hostel's time zone decides where a "day" starts
  const day = localToday(now, utcOffsetMinutes);
  const update = {
    $set: { lastSeen: now, lastPath: path },
    $setOnInsert: { firstSeen: now, device: ua.device, browser: ua.browser, referrerHost: referrerHost(referrer, config.clientOrigin) },
    ...(type === 'view' ? { $inc: { pageviews: 1 } } : {}),
  };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { await Visitor.updateOne({ visitorId, day }, update, { upsert: true }); break; } catch (err) { if (!isDup(err) || attempt) throw err; }
  }
  try { await VisitorLifetime.updateOne({ visitorId }, { $setOnInsert: { visitorId, firstSeen: now } }, { upsert: true }); } catch (err) { if (!isDup(err)) throw err; }
  return true;
}

let cache = { at: 0, value: null };

/** Numbers for the public homepage badge. Only what the admin chose to show, cached for 15 s. */
export async function publicStats() {
  if (Date.now() - cache.at < 15000 && cache.value) return cache.value;
  const settings = await getSettings();
  const vs = settings.visitorStats;
  const show = { onlineNow: vs?.showOnlineNow ?? true, today: vs?.showToday ?? true, total: vs?.showTotal ?? true };
  const { utcOffsetMinutes } = await getConfig();
  const day = localToday(new Date(), utcOffsetMinutes);
  const [online, today, total, first] = await Promise.all([
    show.onlineNow ? Visitor.countDocuments({ lastSeen: { $gte: new Date(Date.now() - ONLINE_WINDOW_MS) } }) : null,
    show.today ? Visitor.countDocuments({ day }) : null,
    show.total ? VisitorLifetime.countDocuments() : null,
    show.total ? VisitorLifetime.findOne().sort({ firstSeen: 1 }).select('firstSeen').lean() : null,
  ]);
  const value = { onlineNow: online, today, total, since: first?.firstSeen ?? null };
  cache = { at: Date.now(), value };
  return value;
}

/** Admin analytics for the last `days` days. */
export async function adminVisitors(days = 30) {
  const { utcOffsetMinutes } = await getConfig();
  const now = new Date();
  const today = localToday(now, utcOffsetMinutes);
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * 864e5).toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const online = new Date(now.getTime() - ONLINE_WINDOW_MS);

  const [daily, month, lifetime, activeNow, byPage, devices, referrers, topPages] = await Promise.all([
    Visitor.aggregate([{ $match: { day: { $gte: from } } }, { $group: { _id: '$day', visitors: { $sum: 1 }, pageviews: { $sum: '$pageviews' } } }]),
    Visitor.aggregate([{ $match: { day: { $gte: monthStart } } }, { $group: { _id: '$visitorId' } }, { $count: 'n' }]),
    VisitorLifetime.countDocuments(),
    Visitor.countDocuments({ lastSeen: { $gte: online } }),
    Visitor.aggregate([{ $match: { lastSeen: { $gte: online } } }, { $group: { _id: '$lastPath', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
    Visitor.aggregate([{ $match: { day: { $gte: from } } }, { $group: { _id: '$device', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Visitor.aggregate([{ $match: { day: { $gte: from }, referrerHost: { $ne: '' } } }, { $group: { _id: '$referrerHost', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
    Visitor.aggregate([{ $match: { day: { $gte: from } } }, { $group: { _id: '$lastPath', n: { $sum: '$pageviews' } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
  ]);

  const byDay = new Map(daily.map((d) => [d._id, d]));
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.parse(`${today}T00:00:00Z`) - i * 864e5).toISOString().slice(0, 10);
    series.push({ day: d, visitors: byDay.get(d)?.visitors ?? 0, pageviews: byDay.get(d)?.pageviews ?? 0 });
  }
  const rows = (a) => a.map((r) => ({ label: r._id || '—', count: r.n }));
  return {
    activeNow, today: series[series.length - 1].visitors, thisMonth: month[0]?.n ?? 0, lifetime,
    series, activeByPage: rows(byPage), devices: rows(devices), referrers: rows(referrers), topPages: rows(topPages),
  };
}
