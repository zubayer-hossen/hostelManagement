import { Router } from 'express';
import * as c from '../../controllers/meetingController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/meeting.validation.js';

const router = Router();

router.get('/config', c.config);
router.get('/availability', validate({ query: v.availabilityQuery }), c.availability);

router.post('/', authenticate, authLimiter, validate({ body: v.createMeetingBody }), c.create);
router.get('/mine', authenticate, c.mine);
router.get('/', authenticate, requirePermission(P.MANAGE_MEETINGS), validate({ query: v.listMeetingsQuery }), c.list);
router.post('/:id/cancel', authenticate, validate({ params: idParams, body: v.cancelMeetingBody }), c.cancel); // owner or staff (service checks)
router.patch('/:id/outcome', authenticate, requirePermission(P.MANAGE_MEETINGS), validate({ params: idParams, body: v.outcomeBody }), c.outcome);

export default router;
