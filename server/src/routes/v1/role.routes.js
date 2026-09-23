import { Router } from 'express';
import * as c from '../../controllers/roleController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireAnyPermission, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import * as v from '../../validations/role.validation.js';

const router = Router();

router.use(authenticate);
router.get('/', requireAnyPermission(P.MANAGE_ROLES, P.MANAGE_USERS), c.list);
router.put('/:key/permissions', requirePermission(P.MANAGE_ROLES), validate({ params: v.roleKeyParams, body: v.updateRolePermissionsBody }), c.updatePermissions);

export default router;
