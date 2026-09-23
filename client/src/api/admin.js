import { api, unwrap } from './client.js';

/** Generic admin client for the CMS resources (banners, headlines, facilities, food-menu, notices, faqs, gallery). */
export const cmsApi = (path) => ({
  list: (params) => unwrap(api.get(`/${path}/admin/all`, { params })),
  create: (body) => unwrap(api.post(`/${path}`, body)),
  update: (id, body) => unwrap(api.patch(`/${path}/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/${path}/${id}`)),
});

export const pagesApi = {
  get: (key) => unwrap(api.get(`/pages/${key}`)),
  save: (key, body) => unwrap(api.put(`/pages/${key}`, body)),
};

export const usersApi = {
  list: (params) => unwrap(api.get('/users', { params })),
  create: (body) => unwrap(api.post('/users', body)),
  update: (id, body) => unwrap(api.patch(`/users/${id}`, body)),
  setRole: (id, role) => unwrap(api.patch(`/users/${id}/role`, { role })),
  remove: (id) => unwrap(api.delete(`/users/${id}`)),
};

export const rolesApi = {
  list: () => unwrap(api.get('/roles')),
  setPermissions: (key, permissions) => unwrap(api.put(`/roles/${key}/permissions`, { permissions })),
};

export const auditApi = { list: (params) => unwrap(api.get('/audit-logs', { params })) };
