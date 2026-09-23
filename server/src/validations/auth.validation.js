import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema, phoneSchema, objectId } from './common.js';

export const registerBody = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
});

export const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export const forgotPasswordBody = z.object({ email: emailSchema });

export const resetPasswordBody = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});

export const verifyEmailBody = z.object({ token: z.string().min(20).max(200) });

export const resendVerificationBody = z.object({ email: emailSchema });

export const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: passwordSchema,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

export const updateProfileBody = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export const sessionParams = z.object({ sessionId: objectId });
