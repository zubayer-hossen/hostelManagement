export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  ADMIN: 'admin',
  HOSTEL_RESIDENT: 'hostel_resident',
  GENERAL_USER: 'general_user',
});

export const ROLE_LIST = Object.values(ROLES);

/** Higher level = more authority. Used to stop privilege escalation. */
export const ROLE_LEVELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.OWNER]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.ADMIN]: 50,
  [ROLES.HOSTEL_RESIDENT]: 10,
  [ROLES.GENERAL_USER]: 5,
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.OWNER]: 'Owner',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.HOSTEL_RESIDENT]: 'Hostel Resident',
  [ROLES.GENERAL_USER]: 'General User',
});

export const ROLE_DESCRIPTIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Full system access, including roles and permissions.',
  [ROLES.OWNER]: 'Business-level control, finance and reporting.',
  [ROLES.MANAGER]: 'Day-to-day hostel operations: residents, rooms, bookings, complaints.',
  [ROLES.ADMIN]: 'Website content and system management according to assigned permissions.',
  [ROLES.HOSTEL_RESIDENT]: 'Resident dashboard: own room, dues, notices, complaints.',
  [ROLES.GENERAL_USER]: 'Public account: browse, request rooms, contact support.',
});

/** Roles that may enter the management dashboard. */
export const STAFF_ROLES = Object.freeze([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ADMIN]);

export const getRoleLevel = (role) => ROLE_LEVELS[role] ?? 0;
