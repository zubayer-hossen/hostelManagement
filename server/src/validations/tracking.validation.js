import { z } from 'zod';

export const trackBody = z.object({
  visitorId: z.string().regex(/^[a-zA-Z0-9-]{16,64}$/, 'Invalid id'),
  path: z.string().max(200).startsWith('/'),
  type: z.enum(['view', 'ping']).default('view'),
  referrer: z.string().max(300).optional(),
});
export const visitorsQuery = z.object({ days: z.coerce.number().int().min(7).max(90).default(30) });
