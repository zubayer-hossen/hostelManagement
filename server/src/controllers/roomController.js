import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as rooms from '../services/roomService.js';
import { logAudit } from '../services/auditService.js';

// ── public ──
export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await rooms.listRooms(req.query);
  res.set('Cache-Control', 'public, max-age=15');
  sendSuccess(res, { data: items, meta: pagination });
});
export const getOne = asyncHandler(async (req, res) => sendSuccess(res, { data: await rooms.getPublicRoom(req.params.id) }));
export const stats = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=15');
  sendSuccess(res, { data: await rooms.getStats() });
});

// ── staff (manageRooms) ──
export const adminList = asyncHandler(async (req, res) => {
  const { items, pagination } = await rooms.listRooms(req.query, { staff: true });
  sendSuccess(res, { data: items, meta: pagination });
});
export const adminGet = asyncHandler(async (req, res) => sendSuccess(res, { data: await rooms.getStaffRoom(req.params.id) }));

export const create = asyncHandler(async (req, res) => {
  const room = await rooms.createRoom(req.body);
  await logAudit({ req, action: 'room.created', entity: 'Room', entityId: room._id, metadata: { roomNumber: room.roomNumber, hostelType: room.hostelType, capacity: room.capacity } });
  sendSuccess(res, { statusCode: 201, message: 'Room created', data: room });
});
export const update = asyncHandler(async (req, res) => {
  const room = await rooms.updateRoom(req.params.id, req.body);
  await logAudit({ req, action: 'room.updated', entity: 'Room', entityId: room._id, metadata: { fields: Object.keys(req.body) } });
  sendSuccess(res, { message: 'Room updated', data: room });
});
export const archive = asyncHandler(async (req, res) => {
  const room = await rooms.archiveRoom(req.params.id);
  await logAudit({ req, action: 'room.archived', entity: 'Room', entityId: room._id, metadata: { roomNumber: room.roomNumber } });
  sendSuccess(res, { message: 'Room archived' });
});
export const setBedMaintenance = asyncHandler(async (req, res) => {
  const bed = await rooms.setBedMaintenance(req.params.id, req.params.bedId, req.body.maintenance);
  await logAudit({ req, action: 'bed.maintenance_changed', entity: 'Bed', entityId: bed._id, metadata: { maintenance: req.body.maintenance } });
  sendSuccess(res, { message: 'Bed updated', data: bed });
});

// ── favorites (any signed-in user) ──
export const listFavorites = asyncHandler(async (req, res) => sendSuccess(res, { data: await rooms.listFavorites(req.user._id) }));
export const favoriteIds = asyncHandler(async (req, res) => sendSuccess(res, { data: await rooms.favoriteIds(req.user._id) }));
export const addFavorite = asyncHandler(async (req, res) => {
  await rooms.addFavorite(req.user._id, req.params.roomId);
  sendSuccess(res, { message: 'Added to favorites' });
});
export const removeFavorite = asyncHandler(async (req, res) => {
  await rooms.removeFavorite(req.user._id, req.params.roomId);
  sendSuccess(res, { message: 'Removed from favorites' });
});
