import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'validation.nameMin').max(80, 'validation.nameMax'),
  email: z.string().trim().min(1, 'validation.required').email('validation.email'),
  phone: z.string().trim().regex(/^(\+?[0-9][0-9\s-]{6,19})?$/, 'validation.phone'),
  subject: z.string().trim().max(140),
  message: z.string().trim().min(10, 'validation.messageMin').max(3000),
  website: z.string().max(200),
});
