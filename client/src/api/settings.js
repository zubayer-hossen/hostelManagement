import { api, unwrap } from './client.js';

export const settingsApi = {
  getPublic: () => unwrap(api.get('/settings/public')),
  update: (body) => unwrap(api.put('/settings', body)),
};
