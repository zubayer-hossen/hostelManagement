import { api, unwrap } from './client.js';

export const trackingApi = {
  send: (body) => api.post('/track', body),
  stats: () => unwrap(api.get('/track/stats')),
  visitors: (days) => unwrap(api.get('/analytics/visitors', { params: { days } })),
};
