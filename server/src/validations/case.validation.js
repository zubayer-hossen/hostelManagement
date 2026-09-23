import { z } from 'zod';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, WARNING_TYPES } from '../constants/resident.js';
import { objectId, paginationQuery } from './common.js';

const t = (max) => z.string().trim().max(max);

export const createComplaintBody = z.object({
  category: z.enum(COMPLAINT_CATEGORIES), subject: t(140).min(3), description: t(3000).min(10, 'Please describe the problem'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});
export const replyBody = z.object({ text: t(1500).min(1) });
export const listComplaintsQuery = paginationQuery.extend({
  status: z.enum(COMPLAINT_STATUSES).optional(), category: z.enum(COMPLAINT_CATEGORIES).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(), assignedTo: objectId.optional(), search: t(80).optional(),
});
export const assignBody = z.object({ assigneeId: objectId });
export const complaintStatusBody = z.object({ status: z.enum(COMPLAINT_STATUSES) });
export const staffNoteBody = z.object({ text: t(1500).min(1), internal: z.boolean().optional() });

export const issueWarningBody = z.object({
  residentId: objectId, type: z.enum(WARNING_TYPES), severity: z.enum(['low', 'medium', 'high']).default('low'),
  reason: t(140).min(3), description: t(2000).optional(),
});
export const closeWarningBody = z.object({ status: z.enum(['resolved', 'withdrawn']), note: t(500).optional() });
export const listWarningsQuery = paginationQuery.extend({
  status: z.enum(['active', 'acknowledged', 'resolved', 'withdrawn']).optional(), residentId: objectId.optional(), severity: z.enum(['low', 'medium', 'high']).optional(),
});
export const listNotificationsQuery = paginationQuery.extend({ unread: z.enum(['true', 'false']).transform((v) => v === 'true').optional() });
