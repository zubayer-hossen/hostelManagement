import { asyncHandler as h } from '../utils/asyncHandler.js';
import { sendSuccess as ok } from '../utils/response.js';
import { PERMISSIONS as P } from '../constants/permissions.js';
import * as svc from '../services/blogService.js';

// public
export const list = h(async (req, res) => { const { items, pagination } = await svc.listPublic(req.query); res.set('Cache-Control', 'public, max-age=30'); ok(res, { data: items, meta: pagination }); });
export const categories = h(async (_req, res) => ok(res, { data: await svc.categories() }));
export const getOne = h(async (req, res) => ok(res, { data: await svc.getPublic(req.params.slug) }));
export const comments = h(async (req, res) => ok(res, { data: await svc.listComments(req.params.slug) }));

// signed in
export const state = h(async (req, res) => { const p = await svc.getPublic(req.params.slug); ok(res, { data: await svc.userState(req.user._id, p._id) }); });
export const like = h(async (req, res) => ok(res, { data: await svc.toggleLike(req.user, req.params.slug) }));
export const bookmark = h(async (req, res) => ok(res, { data: await svc.toggleBookmark(req.user, req.params.slug) }));
export const bookmarks = h(async (req, res) => ok(res, { data: await svc.myBookmarks(req.user._id) }));
export const addComment = h(async (req, res) => ok(res, { statusCode: 201, message: 'Comment posted', data: await svc.addComment(req.user, req.params.slug, req.body, req) }));
export const report = h(async (req, res) => { await svc.reportComment(req.user, req.params.id, req.body.reason); ok(res, { message: 'Thank you. Our team will review this comment.' }); });
export const removeComment = h(async (req, res) => {
  if (req.permissions.includes(P.MANAGE_BLOGS)) await svc.deleteCommentAdmin(req.user, req.params.id, req);
  else await svc.deleteOwnComment(req.user, req.params.id);
  ok(res, { message: 'Comment deleted' });
});

// staff (manageBlogs)
export const adminList = h(async (req, res) => { const { items, pagination } = await svc.listAdmin(req.query); ok(res, { data: items, meta: pagination }); });
export const adminGet = h(async (req, res) => ok(res, { data: await svc.getAdmin(req.params.id) }));
export const create = h(async (req, res) => ok(res, { statusCode: 201, message: 'Post created', data: await svc.createPost(req.user, req.body, req) }));
export const update = h(async (req, res) => ok(res, { message: 'Post saved', data: await svc.updatePost(req.user, req.params.id, req.body, req) }));
export const archive = h(async (req, res) => { await svc.archivePost(req.user, req.params.id, req); ok(res, { message: 'Post archived' }); });
export const adminComments = h(async (req, res) => { const { items, pagination } = await svc.listCommentsAdmin(req.query); ok(res, { data: items, meta: pagination }); });
export const moderate = h(async (req, res) => ok(res, { message: 'Comment updated', data: await svc.moderateComment(req.user, req.params.id, req.body.status, req) }));
