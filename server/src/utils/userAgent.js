/** Coarse, privacy-friendly user-agent classification (no fingerprinting, nothing stored but these categories). */
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|uptime|curl|wget|python-requests|axios|node-fetch/i;

export function parseUserAgent(ua = '') {
  const s = String(ua);
  const isBot = BOT.test(s) || s.length === 0;
  const device = /iPad|Tablet/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s)) ? 'tablet' : /Mobi|iPhone|Android/i.test(s) ? 'mobile' : /Windows|Macintosh|Linux|X11|CrOS/i.test(s) ? 'desktop' : 'other';
  const browser = /Edg\//.test(s) ? 'Edge' : /OPR\/|Opera/.test(s) ? 'Opera' : /SamsungBrowser/.test(s) ? 'Samsung' : /Firefox\//.test(s) ? 'Firefox' : /Chrome\/|CriOS/.test(s) ? 'Chrome' : /Safari\//.test(s) ? 'Safari' : 'Other';
  return { isBot, device, browser };
}

/** Referrer reduced to a host name only; own-site referrers are dropped. */
export function referrerHost(referrer, ownOrigin) {
  try {
    if (!referrer) return '';
    const u = new URL(referrer);
    if (ownOrigin && u.origin === ownOrigin) return '';
    return u.hostname.slice(0, 100);
  } catch { return ''; }
}
