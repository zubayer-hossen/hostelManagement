// Mirrors server/src/constants. Used ONLY for UI (menus, guards). The server enforces every permission independently.
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  ADMIN: 'admin',
  HOSTEL_RESIDENT: 'hostel_resident',
  GENERAL_USER: 'general_user',
};

export const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.ADMIN];
