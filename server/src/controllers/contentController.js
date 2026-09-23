import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

/** Builds the HTTP handlers for one CMS resource from its crud service. */
export function createContentController(svc, entity) {
  return {
    publicList: asyncHandler(async (req, res) => {
      const items = await svc.publicList(req.query);
      res.set('Cache-Control', 'public, max-age=30');
      sendSuccess(res, { data: items });
    }),
    adminList: asyncHandler(async (req, res) => {
      const { items, pagination } = await svc.adminList(req.query);
      sendSuccess(res, { data: items, meta: pagination });
    }),
    adminGet: asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getOne(req.params.id) })),
    create: asyncHandler(async (req, res) =>
      sendSuccess(res, { statusCode: 201, message: `${entity} created`, data: await svc.create(req, req.body) })),
    update: asyncHandler(async (req, res) =>
      sendSuccess(res, { message: `${entity} updated`, data: await svc.update(req, req.params.id, req.body) })),
    remove: asyncHandler(async (req, res) => {
      await svc.remove(req, req.params.id);
      sendSuccess(res, { message: `${entity} deleted` });
    }),
  };
}
