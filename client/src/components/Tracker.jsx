import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackingApi } from '../api/tracking.js';

const KEY = 'dhms_vid';
const SKIP = /^\/(dashboard|login|register|forgot-password|reset-password|verify-email)/;
const PING_MS = 60 * 1000;

function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
    return id;
  } catch {
    return `s-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`.padEnd(16, '0'); // storage blocked: per-page-load id
  }
}

const doNotTrack = () => navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;

/**
 * Anonymous visitor counting for the public site: one "view" per page and a keep-alive "ping" every minute while the
 * tab is visible. It sends a random id, the page path and the referrer's domain — no IP, no cookies, no personal data.
 * Skipped for Do Not Track / Global Privacy Control, and for account pages. Failures are ignored on purpose.
 */
export default function Tracker() {
  const { pathname } = useLocation();
  const current = useRef(pathname);
  current.current = pathname;

  useEffect(() => {
    if (doNotTrack() || SKIP.test(pathname)) return;
    trackingApi.send({ visitorId: visitorId(), path: pathname, type: 'view', ...(document.referrer && { referrer: document.referrer }) }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (doNotTrack()) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible' || SKIP.test(current.current)) return;
      trackingApi.send({ visitorId: visitorId(), path: current.current, type: 'ping' }).catch(() => {});
    }, PING_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
