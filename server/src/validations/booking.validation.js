import { z } from 'zod';
import { BOOKING_STATUS_LIST } from '../constants/booking.js';
import { objectId, emailSchema, nameSchema, paginationQuery } from './common.js';

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export const createBookingBody = z.object({
  roomId: objectId,
  fullName: nameSchema,
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, 'Enter a valid phone number'),
  email: z.union([z.literal(''), emailSchema]).optional(),
  gender: z.enum(['male', 'female']),
  occupation: z.string().trim().max(80).optional(),
  institution: z.string().trim().max(120).optional(),
  expectedMoveIn: z.coerce.date().refine((d) => d >= startOfToday(), 'Move-in date cannot be in the past')
    .refine((d) => d <= new Date(Date.now() + 366 * 24 * 3600 * 1000), 'Move-in date must be within one year'),
  notes: z.string().trim().max(500).optional(),
});

export const bookingIdParams = z.object({ id: objectId });

export const listBookingsQuery = paginationQuery.extend({
  status: z.enum(BOOKING_STATUS_LIST).optional(),
  hostelType: z.enum(['boys', 'girls']).optional(),
  room: objectId.optional(),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(['createdAt', '-createdAt', 'expectedMoveIn', '-expectedMoveIn']).default('-createdAt'),
});

export const decisionBody = z.object({ reason: z.string().trim().max(500).optional() });
export const assignBedBody = z.object({ bedId: objectId });
export const noteBody = z.object({ text: z.string().trim().min(1).max(1000) });
export const checkInBody = z.object({ date: z.coerce.date().optional() });
export const checkOutBody = z.object({ date: z.coerce.date().optional(), reason: z.string().trim().max(300).optional(), acknowledgeOutstanding: z.boolean().optional() });
