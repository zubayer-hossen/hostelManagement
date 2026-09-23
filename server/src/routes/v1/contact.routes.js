import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { contactLimiter } from '../../middleware/rateLimiter.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import { contactBody, contactListQuery, contactStatusBody } from '../../validations/content.validation.js';
import * as c from '../../controllers/contactController.js';

const router = Router();
router.post('/', contactLimiter, validate({ body: contactBody }), c.submit);
router.get('/messages', authenticate, requirePermission(P.MANAGE_SUPPORT), validate({ query: contactListQuery }), c.list);
router.patch('/messages/:id', authenticate, requirePermission(P.MANAGE_SUPPORT), validate({ params: idParams, body: contactStatusBody }), c.setStatus);
export default router;
