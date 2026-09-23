import { api, unwrap } from './client.js';

export const blogApi = {
  list: (params) => unwrap(api.get('/blog', { params })),
  categories: () => unwrap(api.get('/blog/categories')),
  get: (slug) => unwrap(api.get(`/blog/${slug}`)),
  comments: (slug) => unwrap(api.get(`/blog/${slug}/comments`)),
  state: (slug) => unwrap(api.get(`/blog/${slug}/state`)),
  like: (slug) => unwrap(api.post(`/blog/${slug}/like`)),
  bookmark: (slug) => unwrap(api.post(`/blog/${slug}/bookmark`)),
  myBookmarks: () => unwrap(api.get('/blog/mine/bookmarks')),
  addComment: (slug, body) => unwrap(api.post(`/blog/${slug}/comments`, body)),
  reportComment: (id, reason) => unwrap(api.post(`/blog/comments/${id}/report`, { reason })),
  deleteComment: (id) => unwrap(api.delete(`/blog/comments/${id}`)),
  // staff
  adminList: (params) => unwrap(api.get('/blog/admin/all', { params })),
  adminGet: (id) => unwrap(api.get(`/blog/admin/${id}`)),
  create: (body) => unwrap(api.post('/blog', body)),
  update: (id, body) => unwrap(api.patch(`/blog/${id}`, body)),
  archive: (id) => unwrap(api.delete(`/blog/${id}`)),
  adminComments: (params) => unwrap(api.get('/blog/admin/comments', { params })),
  moderate: (id, status) => unwrap(api.patch(`/blog/comments/${id}`, { status })),
};
