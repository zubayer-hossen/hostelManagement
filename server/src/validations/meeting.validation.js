import { z } from 'zod';
import { MEETING_TYPES } from '../models/Meeting.js';
import { paginationQuery } from './common.js';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');

export const availabilityQuery = z.object({ date });
export const createMeetingBody = z.object({ date, time, type: z.enum(MEETING_TYPES), reason: z.string().trim().max(500).default('') });
export const cancelMeetingBody = z.object({ reason: z.string().trim().max(300).optional() });
export const listMeetingsQuery = paginationQuery.extend({
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']).optional(), from: date.optional(), to: date.optional(), order: z.enum(['asc', 'desc']).default('asc'),
});
export const outcomeBody = z.object({ status: z.enum(['completed', 'no_show']) });
