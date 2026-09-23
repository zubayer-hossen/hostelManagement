import { api, unwrap } from './client.js';

export const mediaApi = {
  list: (params) => unwrap(api.get('/media', { params })),
  upload: (file, { purpose = 'general', altText = '' } = {}) => {
    const form = new FormData();
    form.append('file', file);
    form.append('purpose', purpose);
    if (altText) form.append('altText', altText);
    return unwrap(api.post('/media', form, { timeout: 60000 })); // the browser sets the multipart boundary itself
  },
  update: (id, body) => unwrap(api.patch(`/media/${id}`, body)),
  archive: (id) => unwrap(api.delete(`/media/${id}`)),
  overview: () => unwrap(api.get('/analytics/overview')),
};
