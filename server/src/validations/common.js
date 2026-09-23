import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

/** Password policy: 8-128 chars, at least one lowercase, one uppercase and one number. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

export const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(80);

/** Optional phone: empty string allowed; digits, spaces, dashes, leading +. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?[0-9][0-9\s-]{6,19})?$/, 'Enter a valid phone number');

export const idParams = z.object({ id: objectId });

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');
