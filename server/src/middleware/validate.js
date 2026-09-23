import { ApiError } from '../utils/ApiError.js';

/**
 * validate({ params, query, body }) — each value is a Zod schema.
 * On success the parsed (typed, stripped) data REPLACES req.params / req.query / req.body,
 * so controllers never see fields that were not declared in the schema.
 */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];

  for (const part of ['params', 'query', 'body']) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part] ?? {});
    if (result.success) {
      req[part] = result.data;
    } else {
      for (const issue of result.error.issues) {
        errors.push({ field: issue.path.join('.') || part, message: issue.message });
      }
    }
  }

  if (errors.length) return next(ApiError.badRequest('Validation failed', { errors }));
  return next();
};
