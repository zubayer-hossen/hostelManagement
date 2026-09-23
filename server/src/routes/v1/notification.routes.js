import { Router } from 'express';
import * as c from '../../controllers/notificationController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { idParams } from '../../validations/common.js';
import { listNotificationsQuery } from '../../validations/case.validation.js';

const router = Router();
router.use(authenticate);
router.get('/', validate({ query: listNotificationsQuery }), c.list);
router.post('/read-all', c.readAll);
router.post('/:id/read', validate({ params: idParams }), c.read);
export default router;
