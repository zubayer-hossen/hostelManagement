import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { idParams } from '../../validations/common.js';
import { adminListQuery, toPatch } from '../../validations/content.validation.js';
import { RESOURCES } from '../../services/contentResources.js';
import { createCrudService } from '../../services/crudService.js';
import { createContentController } from '../../controllers/contentController.js';

/**
 * For every resource in RESOURCES:
 *   GET    /<path>            public   (only published / active items)
 *   GET    /<path>/admin/all  staff    (all items, paginated, searchable)
 *   GET    /<path>/admin/:id  staff
 *   POST   /<path>            staff
 *   PATCH  /<path>/:id        staff
 *   DELETE /<path>/:id        staff
 */
const router = Router();

for (const r of RESOURCES) {
  const svc = createCrudService(r);
  const c = createContentController(svc, r.entity);
  const guard = [authenticate, requirePermission(r.permission)];
  const sub = Router();

  sub.get('/', validate({ query: r.publicQuery }), c.publicList);
  sub.get('/admin/all', ...guard, validate({ query: adminListQuery }), c.adminList);
  sub.get('/admin/:id', ...guard, validate({ params: idParams }), c.adminGet);
  sub.post('/', ...guard, validate({ body: r.body }), c.create);
  sub.patch('/:id', ...guard, validate({ params: idParams, body: toPatch(r.body) }), c.update);
  sub.delete('/:id', ...guard, validate({ params: idParams }), c.remove);

  router.use(`/${r.path}`, sub);
}

export default router;
