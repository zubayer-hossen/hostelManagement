import { Role } from '../models/Role.js';
import { ROLES, ROLE_LIST, ROLE_LEVELS, ROLE_LABELS, ROLE_DESCRIPTIONS, getRoleLevel } from '../constants/roles.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions.js';
import { ApiError } from '../utils/ApiError.js';
import { clearRoleCache } from './permissionService.js';

export async function listRoles() {
  const docs = await Role.find().lean();
  const byKey = new Map(docs.map((d) => [d.key, d]));
  // Falls back to defaults for any role that has not been seeded yet.
  return ROLE_LIST.map((key) => {
    const d = byKey.get(key);
    return {
      key,
      name: d?.name ?? ROLE_LABELS[key],
      description: d?.description ?? ROLE_DESCRIPTIONS[key],
      level: ROLE_LEVELS[key],
      permissions: d?.permissions ?? DEFAULT_ROLE_PERMISSIONS[key],
    };
  }).sort((a, b) => b.level - a.level);
}

export async function updateRolePermissions(actor, actorPermissions, key, permissions) {
  if (key === ROLES.SUPER_ADMIN) throw ApiError.badRequest('Super Admin permissions cannot be changed');
  if (actor.role !== ROLES.SUPER_ADMIN && getRoleLevel(key) >= getRoleLevel(actor.role)) {
    throw ApiError.forbidden('You cannot edit a role equal to or higher than your own');
  }
  const notHeld = permissions.filter((p) => !actorPermissions.includes(p));
  if (notHeld.length) throw ApiError.forbidden(`You cannot grant permissions you do not have: ${notHeld.join(', ')}`);

  const previous = (await Role.findOne({ key }).lean())?.permissions ?? DEFAULT_ROLE_PERMISSIONS[key];
  const role = await Role.findOneAndUpdate(
    { key },
    {
      $set: { permissions: [...new Set(permissions)] },
      $setOnInsert: { key, name: ROLE_LABELS[key], description: ROLE_DESCRIPTIONS[key], level: ROLE_LEVELS[key] },
    },
    { upsert: true, new: true, runValidators: true }
  );
  clearRoleCache(key);
  return { role, previous };
}
