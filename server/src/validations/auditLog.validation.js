import { z } from 'zod';
import { objectId, paginationQuery } from './common.js';

export const listAuditLogsQuery = paginationQuery.extend({
  actor: objectId.optional(),
  entity: z.string().trim().max(60).optional(),
  action: z.string().trim().max(80).optional(),
});
