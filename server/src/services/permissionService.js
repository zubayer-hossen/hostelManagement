import { Role } from '../models/Role.js';
import { ROLES } from '../constants/roles.js';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_LIST, isValidPermission } from '../constants/permissions.js';

const TTL_MS = 60 * 1000;
const cache = new Map(); // roleKey -> { permissions, expires }

export async function getRolePermissions(roleKey) {
  if (roleKey === ROLES.SUPER_ADMIN) return [...PERMISSION_LIST];

  const hit = cache.get(roleKey);
  if (hit && hit.expires > Date.now()) return hit.permissions;

  const role = await Role.findOne({ key: roleKey }).select('permissions').lean();
  const permissions = (role ? role.permissions : DEFAULT_ROLE_PERMISSIONS[roleKey]) ?? [];
  cache.set(roleKey, { permissions, expires: Date.now() + TTL_MS });
  return permissions;
}

export const clearRoleCache = (roleKey) => (roleKey ? cache.delete(roleKey) : cache.clear());

/** Effective permissions = role permissions + per-user extras. Super Admin always has everything. */
export async function resolvePermissions(user) {
  if (user.role === ROLES.SUPER_ADMIN) return [...PERMISSION_LIST];
  const rolePerms = await getRolePermissions(user.role);
  const extras = (user.extraPermissions || []).filter(isValidPermission);
  return [...new Set([...rolePerms, ...extras])];
}
