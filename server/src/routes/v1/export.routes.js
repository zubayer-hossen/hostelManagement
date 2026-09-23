import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { csvRow } from '../../utils/csv.js';
import { EXPORTS, MAX_ROWS } from '../../services/exportService.js';
import { logAudit } from '../../services/auditService.js';

const router = Router();
router.use(authenticate);

const query = z.object({
  status: z.string().trim().max(30).optional(),
  hostelType: z.enum(['boys', 'girls']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

/** GET /exports/:type -> CSV download. Needs the same permission as the matching management screen. */
router.get('/:type', validate({ query }), asyncHandler(async (req, res) => {
  const def = Object.hasOwn(EXPORTS, req.params.type) ? EXPORTS[req.params.type] : null;
  if (!def) throw ApiError.notFound('Unknown report');
  if (!req.permissions.includes(def.permission)) throw ApiError.forbidden();

  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${req.params.type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    'Cache-Control': 'private, no-store',
  });
  res.write('\uFEFF'); // BOM so Excel reads Bangla and other UTF-8 text correctly
  res.write(csvRow(def.columns));

  let count = 0;
  try {
    for await (const doc of def.query(req.query).limit(MAX_ROWS).cursor()) {
      res.write(csvRow(def.row(doc)));
      count += 1;
    }
  } catch (err) {
    console.error('[export] failed mid-stream:', err.message); // headers are already sent, so just end the file
    res.end();
    return;
  }
  await logAudit({ req, action: 'export.downloaded', entity: 'Report', entityId: req.params.type, metadata: { rows: count } });
  res.end();
}));

export default router;
