import { Router } from 'express';
import * as c from '../../controllers/warningController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/case.validation.js';

const router = Router();
const staff = requirePermission(P.MANAGE_RESIDENTS);
router.use(authenticate);

router.get('/mine', c.mine);
router.post('/:id/acknowledge', validate({ params: idParams }), c.acknowledge);
router.get('/', staff, validate({ query: v.listWarningsQuery }), c.list);
router.post('/', staff, validate({ body: v.issueWarningBody }), c.issue);
router.post('/:id/close', staff, validate({ params: idParams, body: v.closeWarningBody }), c.close);

export default router;
