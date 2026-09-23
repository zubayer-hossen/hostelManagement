import { api, unwrap } from './client.js';

export const supportApi = {
  create: (body) => unwrap(api.post('/support', body)),
  track: (body) => unwrap(api.post('/support/track', body)),
  trackReply: (body) => unwrap(api.post('/support/track/reply', body)),
  mine: () => unwrap(api.get('/support/mine')),
  mineOne: (id) => unwrap(api.get(`/support/mine/${id}`)),
  mineReply: (id, text) => unwrap(api.post(`/support/mine/${id}/reply`, { text })),
  // staff
  list: (params) => unwrap(api.get('/support', { params })),
  get: (id) => unwrap(api.get(`/support/${id}`)),
  reply: (id, body) => unwrap(api.post(`/support/${id}/reply`, body)),
  assign: (id, assigneeId) => unwrap(api.post(`/support/${id}/assign`, { assigneeId })),
  setStatus: (id, status) => unwrap(api.patch(`/support/${id}/status`, { status })),
  setPriority: (id, priority) => unwrap(api.patch(`/support/${id}/priority`, { priority })),
};

export const TICKET_CATEGORIES = ['general', 'room', 'booking', 'food', 'maintenance', 'payment', 'complaint', 'emergency'];
export const TICKET_STATUS_TONE = { open: 'amber', in_progress: 'primary', waiting: 'slate', resolved: 'green', closed: 'slate' };
