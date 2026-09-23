import { User } from '../models/User.js';
import { ROLES, getRoleLevel } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { hashPassword } from './authService.js';
import { revokeAllSessions } from './sessionService.js';
import { resolvePermissions } from './permissionService.js';

/** Actor may act on target only if the actor outranks the target (Super Admin outranks everyone). */
export function assertCanManage(actor, target) {
  if (String(actor._id) === String(target._id)) return;
  if (actor.role === ROLES.SUPER_ADMIN) return;
  if (getRoleLevel(actor.role) <= getRoleLevel(target.role)) {
    throw ApiError.forbidden('You cannot manage a user with an equal or higher role');
  }
}

/** Actor may assign a role only if it is strictly below their own (Super Admin may assign any role). */
export function assertCanAssignRole(actor, role) {
  if (actor.role === ROLES.SUPER_ADMIN) return;
  if (getRoleLevel(role) >= getRoleLevel(actor.role)) {
    throw ApiError.forbidden('You cannot assign a role equal to or higher than your own');
  }
}

async function findOrFail(id) {
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

const SORTS = {
  createdAt: { createdAt: 1 }, '-createdAt': { createdAt: -1 },
  name: { name: 1 }, '-name': { name: -1 },
  lastLoginAt: { lastLoginAt: 1 }, '-lastLoginAt': { lastLoginAt: -1 },
};

export async function listUsers({ page, limit, search, role, isActive, sort }) {
  const filter = { deletedAt: null };
  if (role) filter.role = role;
  if (typeof isActive === 'boolean') filter.isActive = isActive;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort(SORTS[sort] || SORTS['-createdAt']).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination({ page, limit, total }) };
}

export async function getUser(id) {
  const user = await findOrFail(id);
  return { user, permissions: await resolvePermissions(user) };
}

export async function createUser(actor, { name, email, phone, password, role }) {
  assertCanAssignRole(actor, role);
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');

  return User.create({
    name, email, phone, role,
    passwordHash: await hashPassword(password),
    emailVerified: true, // created by staff
  });
}

export async function updateUser(actor, id, data) {
  const user = await findOrFail(id);
  assertCanManage(actor, user);
  if (data.isActive === false && String(actor._id) === String(user._id)) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  Object.assign(user, data);
  await user.save();
  if (data.isActive === false) await revokeAllSessions(user._id, { reason: 'deactivated' });
  return user;
}

export async function changeRole(actor, id, role) {
  const user = await findOrFail(id);
  if (String(actor._id) === String(user._id)) throw ApiError.badRequest('You cannot change your own role');
  assertCanManage(actor, user);
  assertCanAssignRole(actor, role);

  const previousRole = user.role;
  user.role = role;
  await user.save();
  await revokeAllSessions(user._id, { reason: 'role_changed' }); // forces re-login with the new role
  return { user, previousRole };
}

export async function setExtraPermissions(actor, actorPermissions, id, permissions) {
  const user = await findOrFail(id);
  if (String(actor._id) === String(user._id)) throw ApiError.badRequest('You cannot change your own permissions');
  assertCanManage(actor, user);

  // Nobody can hand out a permission they do not hold themselves.
  const notHeld = permissions.filter((p) => !actorPermissions.includes(p));
  if (notHeld.length) throw ApiError.forbidden(`You cannot grant permissions you do not have: ${notHeld.join(', ')}`);

  const previous = user.extraPermissions;
  user.extraPermissions = [...new Set(permissions)];
  await user.save();
  return { user, previous };
}

export async function softDeleteUser(actor, id) {
  const user = await findOrFail(id);
  if (String(actor._id) === String(user._id)) throw ApiError.badRequest('You cannot delete your own account');
  assertCanManage(actor, user);

  user.deletedAt = new Date();
  user.isActive = false;
  await user.save();
  await revokeAllSessions(user._id, { reason: 'deleted' });
  return user;
}
