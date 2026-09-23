import { api, unwrap } from './client.js';

export const roomsApi = {
  list: (params) => unwrap(api.get('/rooms', { params })),
  get: (id) => unwrap(api.get(`/rooms/${id}`)),
  stats: () => unwrap(api.get('/rooms/stats')),
  // favorites (signed in)
  favorites: () => unwrap(api.get('/rooms/favorites')),
  favoriteIds: () => unwrap(api.get('/rooms/favorites/ids')),
  addFavorite: (id) => unwrap(api.put(`/rooms/favorites/${id}`)),
  removeFavorite: (id) => unwrap(api.delete(`/rooms/favorites/${id}`)),
  // staff (manageRooms)
  adminList: (params) => unwrap(api.get('/rooms/admin/all', { params })),
  adminGet: (id) => unwrap(api.get(`/rooms/admin/${id}`)),
  create: (body) => unwrap(api.post('/rooms', body)),
  update: (id, body) => unwrap(api.patch(`/rooms/${id}`, body)),
  archive: (id) => unwrap(api.delete(`/rooms/${id}`)),
  setBedMaintenance: (id, bedId, maintenance) => unwrap(api.patch(`/rooms/${id}/beds/${bedId}/maintenance`, { maintenance })),
};

export const bookingsApi = {
  create: (body) => unwrap(api.post('/bookings', body)),
  mine: () => unwrap(api.get('/bookings/mine')),
  cancel: (id, reason) => unwrap(api.post(`/bookings/${id}/cancel`, { reason })),
  // staff (manageBookings)
  list: (params) => unwrap(api.get('/bookings', { params })),
  get: (id) => unwrap(api.get(`/bookings/${id}`)),
  approve: (id, reason) => unwrap(api.post(`/bookings/${id}/approve`, { reason })),
  reject: (id, reason) => unwrap(api.post(`/bookings/${id}/reject`, { reason })),
  hold: (id, reason) => unwrap(api.post(`/bookings/${id}/hold`, { reason })),
  addNote: (id, text) => unwrap(api.post(`/bookings/${id}/notes`, { text })),
  assignBed: (id, bedId) => unwrap(api.patch(`/bookings/${id}/bed`, { bedId })),
  checkIn: (id, body = {}) => unwrap(api.post(`/bookings/${id}/check-in`, body)),
  checkOut: (id, body = {}) => unwrap(api.post(`/bookings/${id}/check-out`, body)),
};
