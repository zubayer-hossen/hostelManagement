import { Router } from 'express';
import * as c from '../../controllers/userController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(P.MANAGE_USERS), validate({ query: v.listUsersQuery }), c.list);
router.post('/', requirePermission(P.MANAGE_USERS), validate({ body: v.createUserBody }), c.create);
router.get('/:id', requirePermission(P.MANAGE_USERS), validate({ params: idParams }), c.getOne);
router.patch('/:id', requirePermission(P.MANAGE_USERS), validate({ params: idParams, body: v.updateUserBody }), c.update);
router.delete('/:id', requirePermission(P.MANAGE_USERS), validate({ params: idParams }), c.remove);

// Role / permission assignment needs the stronger permission.
router.patch('/:id/role', requirePermission(P.MANAGE_USERS, P.MANAGE_ROLES), validate({ params: idParams, body: v.changeRoleBody }), c.changeRole);
router.put('/:id/permissions', requirePermission(P.MANAGE_USERS, P.MANAGE_ROLES), validate({ params: idParams, body: v.setPermissionsBody }), c.setPermissions);

export default router;
