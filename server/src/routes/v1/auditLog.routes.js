import { Router } from 'express';
import * as c from '../../controllers/auditLogController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { listAuditLogsQuery } from '../../validations/auditLog.validation.js';

const router = Router();

router.get('/', authenticate, requirePermission(P.VIEW_AUDIT_LOGS), validate({ query: listAuditLogsQuery }), c.list);

export default router;
