import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { getOverview } from '../../services/analyticsService.js';
import { adminVisitors } from '../../services/trackingService.js';
import { validate } from '../../middleware/validate.js';
import { visitorsQuery } from '../../validations/tracking.validation.js';

const router = Router();
router.get('/overview', authenticate, requirePermission(P.VIEW_ANALYTICS), asyncHandler(async (_req, res) => sendSuccess(res, { data: await getOverview() })));
router.get('/visitors', authenticate, requirePermission(P.VIEW_ANALYTICS), validate({ query: visitorsQuery }), asyncHandler(async (req, res) => sendSuccess(res, { data: await adminVisitors(req.query.days) })));

export default router;
