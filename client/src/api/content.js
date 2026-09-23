import { api, unwrap } from './client.js';

/** Public (no login) content endpoints. */
export const contentApi = {
  banners: () => unwrap(api.get('/banners')),
  headlines: () => unwrap(api.get('/headlines')),
  facilities: (params) => unwrap(api.get('/facilities', { params })),
  foodMenu: (params) => unwrap(api.get('/food-menu', { params })),
  events: (params) => unwrap(api.get('/events', { params })),
  notices: (params) => unwrap(api.get('/notices', { params })),
  faqs: (params) => unwrap(api.get('/faqs', { params })),
  gallery: (params) => unwrap(api.get('/gallery', { params })),
  page: (key) => unwrap(api.get(`/pages/${key}`)),
  sendContact: (body) => unwrap(api.post('/contact', body)),
};
