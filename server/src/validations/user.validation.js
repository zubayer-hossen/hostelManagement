import { z } from 'zod';
import { ROLE_LIST } from '../constants/roles.js';
import { PERMISSION_LIST } from '../constants/permissions.js';
import { emailSchema, passwordSchema, nameSchema, phoneSchema, paginationQuery, booleanQuery } from './common.js';

const roleEnum = z.enum(ROLE_LIST);

export const listUsersQuery = paginationQuery.extend({
  search: z.string().trim().max(80).optional(),
  role: roleEnum.optional(),
  isActive: booleanQuery.optional(),
  sort: z.enum(['createdAt', '-createdAt', 'name', '-name', 'lastLoginAt', '-lastLoginAt']).default('-createdAt'),
});

export const createUserBody = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  role: roleEnum,
});

export const updateUserBody = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export const changeRoleBody = z.object({ role: roleEnum });

export const setPermissionsBody = z.object({
  permissions: z.array(z.enum(PERMISSION_LIST)).max(PERMISSION_LIST.length),
});
