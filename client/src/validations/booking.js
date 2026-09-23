import { z } from 'zod';

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export const bookingSchema = z.object({
  fullName: z.string().trim().min(2, 'validation.nameMin').max(80, 'validation.nameMax'),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, 'validation.phone'),
  email: z.string().trim().refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'validation.email'),
  gender: z.enum(['male', 'female']),
  occupation: z.string().trim().max(80),
  institution: z.string().trim().max(120),
  expectedMoveIn: z.string().min(1, 'validation.required').refine((v) => new Date(v) >= today(), 'validation.datePast'),
  notes: z.string().trim().max(500),
});
