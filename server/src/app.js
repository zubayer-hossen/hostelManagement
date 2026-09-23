import express from 'express';
import { UPLOAD_DIR } from './services/storage/local.js';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import v1Routes from './routes/v1/index.js';
import seoRoutes from './routes/seo.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.TRUST_PROXY > 0) app.set('trust proxy', config.TRUST_PROXY);

  app.use(helmet({
    // A single-origin API + separately hosted SPA: no inline scripts are served here, so a strict default is safe.
    contentSecurityPolicy: { useDefaults: true, directives: { 'default-src': ["'self'"], 'img-src': ["'self'", 'data:', 'https:'], 'object-src': ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // /uploads must be readable from the SPA's own origin
  }));

  app.use(
    cors({
      origin(origin, cb) {
        const allowedOrigin = 'https://hostelbd.netlify.app';
        // Allow same-origin / non-browser clients (no Origin header) and the Netlify frontend only.
        if (!origin || origin === allowedOrigin) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(compression());
  if (!config.isProd || process.env.LOG_REQUESTS === 'true') app.use(morgan(config.isProd ? 'combined' : 'dev'));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  // Uploaded images (local storage provider). Only files we wrote, no directory listing, never executed.
  app.use('/uploads', express.static(UPLOAD_DIR, {
    index: false, dotfiles: 'deny', maxAge: '7d', immutable: true, fallthrough: false,
    setHeaders: (res) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); res.setHeader('X-Content-Type-Options', 'nosniff'); },
  }));

  app.use(seoRoutes); // /sitemap.xml, /robots.txt — served by the API; proxy or redirect these paths from the frontend host

  app.use('/api', apiLimiter);
  app.use('/api/v1', v1Routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}