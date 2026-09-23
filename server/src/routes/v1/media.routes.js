import { Router } from 'express';
import multer from 'multer';
import { config } from '../../config/env.js';
import * as c from '../../controllers/mediaController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requireAnyPermission, requirePermission } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/media.validation.js';

// Files are held in memory (size-capped), verified by content, then handed to the storage provider.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024, files: 1 } });

/** Anyone who manages content that shows pictures may upload and browse. Archiving needs manageMedia. */
const canUse = requireAnyPermission(P.MANAGE_MEDIA, P.MANAGE_ROOMS, P.MANAGE_GALLERY, P.MANAGE_BANNERS, P.MANAGE_FACILITIES, P.MANAGE_FOOD_MENU, P.MANAGE_NOTICES, P.MANAGE_EVENTS);

const router = Router();
router.use(authenticate);
router.post('/', canUse, authLimiter, upload.single('file'), validate({ body: v.uploadBody }), c.upload);
router.get('/', canUse, validate({ query: v.listMediaQuery }), c.list);
router.patch('/:id', requirePermission(P.MANAGE_MEDIA), validate({ params: idParams, body: v.updateMediaBody }), c.update);
router.delete('/:id', requirePermission(P.MANAGE_MEDIA), validate({ params: idParams }), c.archive);
export default router;
