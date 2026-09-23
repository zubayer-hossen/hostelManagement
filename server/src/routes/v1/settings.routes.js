import { Router } from 'express';
import * as c from '../../controllers/settingsController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { updateSettingsBody } from '../../validations/settings.validation.js';

const router = Router();

router.get('/public', c.getPublic);
router.put('/', authenticate, requirePermission(P.MANAGE_SETTINGS), validate({ body: updateSettingsBody }), c.update);

export default router;
