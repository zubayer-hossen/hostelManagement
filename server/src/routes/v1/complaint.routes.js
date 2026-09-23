import { Router } from 'express';
import * as c from '../../controllers/complaintController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/case.validation.js';

const router = Router();
const staff = requirePermission(P.MANAGE_COMPLAINTS);
router.use(authenticate);

router.post('/', validate({ body: v.createComplaintBody }), c.create);
router.get('/mine', c.mine);
router.get('/', staff, validate({ query: v.listComplaintsQuery }), c.list);
router.get('/:id', validate({ params: idParams }), c.getOne);            // owner or staff (service checks)
router.post('/:id/reply', validate({ params: idParams, body: v.replyBody }), c.reply);
router.post('/:id/assign', staff, validate({ params: idParams, body: v.assignBody }), c.assign);
router.patch('/:id/status', staff, validate({ params: idParams, body: v.complaintStatusBody }), c.setStatus);
router.post('/:id/notes', staff, validate({ params: idParams, body: v.staffNoteBody }), c.addNote);

export default router;
