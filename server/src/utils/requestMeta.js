export const getClientIp = (req) => req.ip || req.socket?.remoteAddress || '';
export const getUserAgent = (req) => String(req.headers['user-agent'] || '').slice(0, 300);
