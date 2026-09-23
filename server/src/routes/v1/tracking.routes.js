import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { trackBody } from '../../validations/tracking.validation.js';
import { record, publicStats } from '../../services/trackingService.js';

const router = Router();

// A visitor sends about one request a minute; this only stops abuse.
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });

/** POST /track — page view or keep-alive ping. Honors Do Not Track. Always 204: the site must never depend on this. */
router.post('/', limiter, validate({ body: trackBody }), asyncHandler(async (req, res) => {
  if (req.headers.dnt === '1' || req.headers['sec-gpc'] === '1') return res.status(204).end();
  try {
    await record({ ...req.body, userAgent: req.headers['user-agent'] });
  } catch (err) {
    console.error('[track] failed:', err.message);
  }
  return res.status(204).end();
}));

router.get('/stats', asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=15');
  sendSuccess(res, { data: await publicStats() });
}));

export default router;
