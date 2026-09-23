import { Router } from 'express';
import multer from 'multer';
import { MAX_DOCUMENT_BYTES } from '../../services/documentService.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import * as c from '../../controllers/residentController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/resident.validation.js';

const router = Router();
const docUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 } });
const docStaff = requirePermission(P.MANAGE_RESIDENT_DOCUMENTS);
const staff = requirePermission(P.MANAGE_RESIDENTS);
router.use(authenticate);

// The signed-in resident (declared before "/:id")
router.get('/me', c.me);
router.put('/me', validate({ body: v.updateResidentBody }), c.updateMe);
router.post('/me/acknowledge-rules', c.acknowledgeRules);
router.get('/me/notices', c.notices);
router.post('/me/move-out', validate({ body: v.moveOutRequestBody }), c.requestMoveOut);

// Own documents (private)
router.get('/me/documents', c.myDocuments);
router.post('/me/documents', authLimiter, docUpload.single('file'), validate({ body: v.documentUploadBody }), c.uploadDocument);
router.delete('/me/documents/:docId', validate({ params: v.documentParams }), c.deleteDocument);
router.get('/me/documents/:docId/file', validate({ params: v.documentParams }), c.myDocumentFile);

// Staff
router.get('/', staff, validate({ query: v.listResidentsQuery }), c.list);
router.get('/:id/documents', docStaff, validate({ params: idParams }), c.residentDocuments);
router.get('/:id/documents/:docId/file', docStaff, validate({ params: v.residentDocumentParams }), c.residentDocumentFile);
router.patch('/:id/documents/:docId', docStaff, validate({ params: v.residentDocumentParams, body: v.documentReviewBody }), c.reviewDocument);
router.get('/:id', staff, validate({ params: idParams }), c.getOne);
router.patch('/:id/verify', staff, validate({ params: idParams, body: v.verifyBody }), c.verify);
router.post('/:id/transfer', staff, validate({ params: idParams, body: v.transferBody }), c.transfer);
router.post('/:id/move-out/decision', staff, validate({ params: idParams, body: v.moveOutDecisionBody }), c.decideMoveOut);

export default router;
