/** Consistent success envelope: { success, message, data, meta? } */
export function sendSuccess(res, { data = null, message = 'Operation successful', statusCode = 200, meta } = {}) {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function buildPagination({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
