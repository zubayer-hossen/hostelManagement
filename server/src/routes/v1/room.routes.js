import { Router } from 'express';
import * as c from '../../controllers/roomController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import * as v from '../../validations/room.validation.js';

const router = Router();
const staff = [authenticate, requirePermission(P.MANAGE_ROOMS)];

// Any signed-in user: favorites (declared before "/:id" so the paths are not captured as ids)
router.get('/favorites', authenticate, c.listFavorites);
router.get('/favorites/ids', authenticate, c.favoriteIds);
router.put('/favorites/:roomId', authenticate, validate({ params: v.roomFavoriteParams }), c.addFavorite);
router.delete('/favorites/:roomId', authenticate, validate({ params: v.roomFavoriteParams }), c.removeFavorite);

// Public
router.get('/stats', c.stats);
router.get('/', validate({ query: v.listRoomsQuery }), c.list);

// Staff
router.get('/admin/all', ...staff, validate({ query: v.adminRoomsQuery }), c.adminList);
router.get('/admin/:id', ...staff, validate({ params: v.roomIdParams }), c.adminGet);
router.post('/', ...staff, validate({ body: v.createRoomBody }), c.create);
router.patch('/:id', ...staff, validate({ params: v.roomIdParams, body: v.updateRoomBody }), c.update);
router.delete('/:id', ...staff, validate({ params: v.roomIdParams }), c.archive);
router.patch('/:id/beds/:bedId/maintenance', ...staff, validate({ params: v.bedParams, body: v.bedMaintenanceBody }), c.setBedMaintenance);

// Public detail (last, so it does not shadow the paths above)
router.get('/:id', validate({ params: v.roomIdParams }), c.getOne);

export default router;
