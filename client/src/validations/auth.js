import { z } from 'zod';

// Messages are i18n keys (see locales/*/translation.json → "validation").
const email = z.string().trim().min(1, 'validation.required').email('validation.email');
const name = z.string().trim().min(2, 'validation.nameMin').max(80, 'validation.nameMax');
const phone = z.string().trim().regex(/^(\+?[0-9][0-9\s-]{6,19})?$/, 'validation.phone');
const password = z
  .string()
  .min(8, 'validation.passwordMin')
  .max(128, 'validation.passwordMax')
  .regex(/[a-z]/, 'validation.passwordLower')
  .regex(/[A-Z]/, 'validation.passwordUpper')
  .regex(/\d/, 'validation.passwordNumber');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z
  .object({ name, email, phone: phone.optional().or(z.literal('')), password, confirmPassword: z.string().min(1, 'validation.required') })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'validation.passwordMatch' });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password, confirmPassword: z.string().min(1, 'validation.required') })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'validation.passwordMatch' });

export const profileSchema = z.object({ name, phone });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'validation.required'), newPassword: password, confirmPassword: z.string().min(1, 'validation.required') })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'validation.passwordMatch' })
  .refine((d) => d.currentPassword !== d.newPassword, { path: ['newPassword'], message: 'validation.passwordDifferent' });
