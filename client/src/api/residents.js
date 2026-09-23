import { api, unwrap } from './client.js';

export const residentApi = {
  me: () => unwrap(api.get('/residents/me')),
  updateMe: (body) => unwrap(api.put('/residents/me', body)),
  acknowledgeRules: () => unwrap(api.post('/residents/me/acknowledge-rules')),
  notices: () => unwrap(api.get('/residents/me/notices')),
  requestMoveOut: (body) => unwrap(api.post('/residents/me/move-out', body)),
  // own documents (private)
  myDocuments: () => unwrap(api.get('/residents/me/documents')),
  uploadDocument: (file, { type, label = '' }) => {
    const form = new FormData();
    form.append('file', file); form.append('type', type); if (label) form.append('label', label);
    return unwrap(api.post('/residents/me/documents', form, { timeout: 60000 }));
  },
  deleteDocument: (docId) => unwrap(api.delete(`/residents/me/documents/${docId}`)),
  myDocumentBlob: (docId) => api.get(`/residents/me/documents/${docId}/file`, { responseType: 'blob' }).then((r) => r.data),
  // staff
  documents: (id) => unwrap(api.get(`/residents/${id}/documents`)),
  documentBlob: (id, docId) => api.get(`/residents/${id}/documents/${docId}/file`, { responseType: 'blob' }).then((r) => r.data),
  reviewDocument: (id, docId, body) => unwrap(api.patch(`/residents/${id}/documents/${docId}`, body)),
  list: (params) => unwrap(api.get('/residents', { params })),
  get: (id) => unwrap(api.get(`/residents/${id}`)),
  verify: (id, body) => unwrap(api.patch(`/residents/${id}/verify`, body)),
  transfer: (id, body) => unwrap(api.post(`/residents/${id}/transfer`, body)),
  decideMoveOut: (id, body) => unwrap(api.post(`/residents/${id}/move-out/decision`, body)),
};

export const financeApi = {
  myDues: () => unwrap(api.get('/dues/mine')),
  myPayments: () => unwrap(api.get('/payments/mine')),
  summary: () => unwrap(api.get('/dues/summary')),
  dues: (params) => unwrap(api.get('/dues', { params })),
  payments: (params) => unwrap(api.get('/payments', { params })),
  generate: (body) => unwrap(api.post('/dues/generate', body)),
  createDue: (body) => unwrap(api.post('/dues', body)),
  voidDue: (id, reason) => unwrap(api.post(`/dues/${id}/void`, { reason })),
  record: (body) => unwrap(api.post('/payments', body)),
  voidPayment: (id, reason) => unwrap(api.post(`/payments/${id}/void`, { reason })),
};

export const complaintsApi = {
  create: (body) => unwrap(api.post('/complaints', body)),
  mine: () => unwrap(api.get('/complaints/mine')),
  get: (id) => unwrap(api.get(`/complaints/${id}`)),
  reply: (id, text) => unwrap(api.post(`/complaints/${id}/reply`, { text })),
  list: (params) => unwrap(api.get('/complaints', { params })),
  assign: (id, assigneeId) => unwrap(api.post(`/complaints/${id}/assign`, { assigneeId })),
  setStatus: (id, status) => unwrap(api.patch(`/complaints/${id}/status`, { status })),
  addNote: (id, body) => unwrap(api.post(`/complaints/${id}/notes`, body)),
};

export const warningsApi = {
  mine: () => unwrap(api.get('/warnings/mine')),
  acknowledge: (id) => unwrap(api.post(`/warnings/${id}/acknowledge`)),
  list: (params) => unwrap(api.get('/warnings', { params })),
  issue: (body) => unwrap(api.post('/warnings', body)),
  close: (id, body) => unwrap(api.post(`/warnings/${id}/close`, body)),
};

export const notificationsApi = {
  list: (params) => unwrap(api.get('/notifications', { params })),
  read: (id) => unwrap(api.post(`/notifications/${id}/read`)),
  readAll: () => unwrap(api.post('/notifications/read-all')),
};
