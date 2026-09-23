import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as userService from '../services/userService.js';
import { logAudit } from '../services/auditService.js';

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await userService.listUsers(req.query);
  sendSuccess(res, { data: items, meta: pagination });
});

export const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await userService.getUser(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.user, req.body);
  await logAudit({ req, action: 'user.created', entity: 'User', entityId: user._id, metadata: { role: user.role, email: user.email } });
  sendSuccess(res, { statusCode: 201, message: 'User created', data: user });
});

export const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user, req.params.id, req.body);
  await logAudit({ req, action: 'user.updated', entity: 'User', entityId: user._id, metadata: { fields: Object.keys(req.body) } });
  sendSuccess(res, { message: 'User updated', data: user });
});

export const changeRole = asyncHandler(async (req, res) => {
  const { user, previousRole } = await userService.changeRole(req.user, req.params.id, req.body.role);
  await logAudit({ req, action: 'user.role_changed', entity: 'User', entityId: user._id, metadata: { from: previousRole, to: user.role } });
  sendSuccess(res, { message: 'Role updated', data: user });
});

export const setPermissions = asyncHandler(async (req, res) => {
  const { user, previous } = await userService.setExtraPermissions(req.user, req.permissions, req.params.id, req.body.permissions);
  await logAudit({
    req, action: 'user.permissions_changed', entity: 'User', entityId: user._id,
    metadata: { from: previous, to: user.extraPermissions },
  });
  sendSuccess(res, { message: 'Permissions updated', data: user });
});

export const remove = asyncHandler(async (req, res) => {
  const user = await userService.softDeleteUser(req.user, req.params.id);
  await logAudit({ req, action: 'user.deleted', entity: 'User', entityId: user._id, metadata: { email: user.email } });
  sendSuccess(res, { message: 'User deleted' });
});
