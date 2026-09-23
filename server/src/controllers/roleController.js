import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as roleService from '../services/roleService.js';
import { logAudit } from '../services/auditService.js';
import { PERMISSION_LIST } from '../constants/permissions.js';

export const list = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: { roles: await roleService.listRoles(), permissionCatalog: PERMISSION_LIST } });
});

export const updatePermissions = asyncHandler(async (req, res) => {
  const { role, previous } = await roleService.updateRolePermissions(req.user, req.permissions, req.params.key, req.body.permissions);
  await logAudit({
    req, action: 'role.permissions_changed', entity: 'Role', entityId: role.key,
    metadata: { from: previous, to: role.permissions },
  });
  sendSuccess(res, { message: 'Role permissions updated', data: role });
});
