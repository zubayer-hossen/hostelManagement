import { z } from 'zod';
import { ROLE_LIST } from '../constants/roles.js';
import { PERMISSION_LIST } from '../constants/permissions.js';

export const roleKeyParams = z.object({ key: z.enum(ROLE_LIST) });

export const updateRolePermissionsBody = z.object({
  permissions: z.array(z.enum(PERMISSION_LIST)).max(PERMISSION_LIST.length),
});
