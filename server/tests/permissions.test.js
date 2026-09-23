import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, ROLE_LIST, ROLE_LEVELS, getRoleLevel } from '../src/constants/roles.js';
import { PERMISSIONS, PERMISSION_LIST, DEFAULT_ROLE_PERMISSIONS, isValidPermission } from '../src/constants/permissions.js';

test('every role has a level and default permission list', () => {
  for (const r of ROLE_LIST) {
    assert.ok(ROLE_LEVELS[r] > 0, `${r} has a level`);
    assert.ok(Array.isArray(DEFAULT_ROLE_PERMISSIONS[r]), `${r} has defaults`);
  }
});

test('role hierarchy is strictly ordered', () => {
  assert.ok(getRoleLevel(ROLES.SUPER_ADMIN) > getRoleLevel(ROLES.OWNER));
  assert.ok(getRoleLevel(ROLES.OWNER) > getRoleLevel(ROLES.MANAGER));
  assert.ok(getRoleLevel(ROLES.MANAGER) > getRoleLevel(ROLES.ADMIN));
  assert.ok(getRoleLevel(ROLES.ADMIN) > getRoleLevel(ROLES.HOSTEL_RESIDENT));
  assert.ok(getRoleLevel(ROLES.HOSTEL_RESIDENT) > getRoleLevel(ROLES.GENERAL_USER));
  assert.equal(getRoleLevel('nope'), 0);
});

test('super admin owns all permissions, owner lacks only manageRoles', () => {
  assert.deepEqual(new Set(DEFAULT_ROLE_PERMISSIONS[ROLES.SUPER_ADMIN]), new Set(PERMISSION_LIST));
  const missing = PERMISSION_LIST.filter((p) => !DEFAULT_ROLE_PERMISSIONS[ROLES.OWNER].includes(p));
  assert.deepEqual(missing, [PERMISSIONS.MANAGE_ROLES]);
});

test('only Super Admin holds manageRoles by default', () => {
  for (const r of ROLE_LIST.filter((x) => x !== ROLES.SUPER_ADMIN)) {
    assert.ok(!DEFAULT_ROLE_PERMISSIONS[r].includes(PERMISSIONS.MANAGE_ROLES), `${r} must not manage roles`);
  }
});

test('residents and general users get no dashboard permissions', () => {
  assert.equal(DEFAULT_ROLE_PERMISSIONS[ROLES.HOSTEL_RESIDENT].length, 0);
  assert.equal(DEFAULT_ROLE_PERMISSIONS[ROLES.GENERAL_USER].length, 0);
});

test('default permissions only reference valid permissions, no duplicates', () => {
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    assert.equal(new Set(perms).size, perms.length, `${role} has duplicates`);
    perms.forEach((p) => assert.ok(isValidPermission(p), `${role}: ${p} invalid`));
  }
});
