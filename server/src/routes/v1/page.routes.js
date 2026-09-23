import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireAnyPermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { pageParams, pageBody } from '../../validations/content.validation.js';
import * as c from '../../controllers/pageController.js';

const router = Router();
router.get('/:key', validate({ params: pageParams }), c.getPage);
router.put('/:key', authenticate, requireAnyPermission(P.MANAGE_RULES, P.MANAGE_SETTINGS), validate({ params: pageParams, body: pageBody }), c.savePage);
export default router;
