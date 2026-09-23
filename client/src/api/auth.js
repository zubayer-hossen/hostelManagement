import { api, unwrap } from './client.js';

export const authApi = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  logout: () => unwrap(api.post('/auth/logout')),
  logoutAll: () => unwrap(api.post('/auth/logout-all')),
  me: () => unwrap(api.get('/auth/me')),
  updateMe: (body) => unwrap(api.patch('/auth/me', body)),
  changePassword: (body) => unwrap(api.post('/auth/change-password', body)),
  forgotPassword: (body) => unwrap(api.post('/auth/forgot-password', body)),
  resetPassword: (body) => unwrap(api.post('/auth/reset-password', body)),
  verifyEmail: (body) => unwrap(api.post('/auth/verify-email', body)),
  resendVerification: (body) => unwrap(api.post('/auth/resend-verification', body)),
  sessions: () => unwrap(api.get('/auth/sessions')),
  revokeSession: (id) => unwrap(api.delete(`/auth/sessions/${id}`)),
  loginHistory: () => unwrap(api.get('/auth/login-history')),
};
