/**
 * Minimal offline fallback service worker: caches nothing proactively, only serves the offline page
 * when a navigation request fails (no connection). All API and data requests go to the network as normal.
 */
const OFFLINE_URL = '/offline.html';
const CACHE = 'dhms-offline-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return; // only page loads get an offline fallback
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
