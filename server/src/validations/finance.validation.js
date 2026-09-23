import { z } from 'zod';
import { DUE_TYPES, PAYMENT_METHODS } from '../constants/resident.js';
import { objectId, paginationQuery } from './common.js';

const month = z.coerce.number().int().min(1).max(12);
const year = z.coerce.number().int().min(2000).max(2100);
const amount = z.number().positive().max(10000000);

export const generateRentBody = z.object({ month, year, dueDay: z.number().int().min(1).max(28).default(10) });
export const createDueBody = z.object({
  residentId: objectId, type: z.enum(DUE_TYPES), month, year, amount,
  description: z.string().trim().max(200).optional(), dueDate: z.coerce.date(),
});
export const voidBody = z.object({ reason: z.string().trim().min(3, 'Please give a reason').max(300) });
export const recordPaymentBody = z.object({
  dueId: objectId, amount, method: z.enum(PAYMENT_METHODS),
  transactionId: z.string().trim().max(80).optional(), paidAt: z.coerce.date().refine((d) => d <= new Date(Date.now() + 864e5), 'Payment date cannot be in the future').optional(), note: z.string().trim().max(300).optional(),
});
export const listDuesQuery = paginationQuery.extend({
  status: z.enum(['due', 'partially_paid', 'paid', 'overdue', 'void']).optional(),
  residentId: objectId.optional(), month: month.optional(), year: year.optional(), type: z.enum(DUE_TYPES).optional(), search: z.string().trim().max(80).optional(),
});
export const listPaymentsQuery = paginationQuery.extend({
  residentId: objectId.optional(), method: z.enum(PAYMENT_METHODS).optional(), status: z.enum(['recorded', 'voided']).optional(),
  from: z.coerce.date().optional(), to: z.coerce.date().optional(),
});
