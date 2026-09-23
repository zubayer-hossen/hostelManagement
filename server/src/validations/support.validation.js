import { z } from 'zod';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../constants/support.js';
import { emailSchema, nameSchema, phoneSchema, objectId, paginationQuery } from './common.js';

const text = (max) => z.string().trim().max(max);

export const createTicketBody = z.object({
  name: nameSchema.optional(),   // required for guests, taken from the account when signed in
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  category: z.enum(TICKET_CATEGORIES),
  subject: text(140).min(3),
  message: text(3000).min(10, 'Please describe your request'),
  website: z.string().max(200).optional(), // honeypot
});

export const trackBody = z.object({ code: z.string().trim().toUpperCase().regex(/^TKT-[A-Z0-9]{6}$/, 'Invalid ticket code'), token: z.string().trim().length(32, 'Invalid tracking key') });
export const trackReplyBody = trackBody.extend({ text: text(3000).min(1) });
export const replyBody = z.object({ text: text(3000).min(1), internal: z.boolean().optional() });
export const listTicketsQuery = paginationQuery.extend({
  status: z.enum(TICKET_STATUSES).optional(), category: z.enum(TICKET_CATEGORIES).optional(), priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedTo: objectId.optional(), search: text(80).optional(),
});
export const assignTicketBody = z.object({ assigneeId: objectId });
export const ticketStatusBody = z.object({ status: z.enum(TICKET_STATUSES) });
export const ticketPriorityBody = z.object({ priority: z.enum(TICKET_PRIORITIES) });
