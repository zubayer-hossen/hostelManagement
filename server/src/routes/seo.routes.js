import { Router } from 'express';
import { config } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { BlogPost } from '../models/BlogPost.js';
import { Room } from '../models/Room.js';
import { liveFilter } from '../services/blogService.js';

/**
 * Sitemap + robots for the PUBLIC SITE origin (CLIENT_URL), not the API. Mounted outside /api/v1 so it can be
 * proxied to /sitemap.xml at the site's root, or fetched directly if the frontend host rewrites to it.
 */
const router = Router();
const site = () => config.CLIENT_URL.replace(/\/$/, '');
const STATIC_PATHS = ['/', '/about', '/boys-hostel', '/girls-hostel', '/rooms', '/facilities', '/food-menu', '/gallery', '/notices', '/events', '/blog', '/faq', '/contact', '/support', '/meetings', '/rules', '/terms', '/privacy', '/login', '/register'];

const urlXml = (loc, lastmod) => `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`;

router.get('/sitemap.xml', asyncHandler(async (_req, res) => {
  const base = site();
  const [posts, rooms] = await Promise.all([
    BlogPost.find(liveFilter()).select('slug updatedAt').limit(2000),
    Room.find({ archivedAt: null, status: { $ne: 'inactive' } }).select('_id updatedAt').limit(2000),
  ]);
  const urls = [
    ...STATIC_PATHS.map((p) => urlXml(`${base}${p}`)),
    ...rooms.map((r) => urlXml(`${base}/rooms/${r._id}`, r.updatedAt)),
    ...posts.map((p) => urlXml(`${base}/blog/${p.slug}`, p.updatedAt)),
  ];
  res.set('Content-Type', 'application/xml').set('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
}));

router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /login\nDisallow: /register\nDisallow: /forgot-password\nDisallow: /reset-password\nDisallow: /verify-email\n\nSitemap: ${site()}/sitemap.xml\n`);
});

export default router;
