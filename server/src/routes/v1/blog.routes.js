import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../../controllers/blogController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/blog.validation.js';

const router = Router();
const staff = [authenticate, requirePermission(P.MANAGE_BLOGS)];
const commentLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'You are commenting too fast. Please wait a few minutes.', errors: [] } });

// Public + fixed paths first (so they are not captured by "/:slug")
router.get('/', validate({ query: v.listPostsQuery }), c.list);
router.get('/categories', c.categories);
router.get('/mine/bookmarks', authenticate, c.bookmarks);

// Staff
router.get('/admin/all', ...staff, validate({ query: v.adminPostsQuery }), c.adminList);
router.get('/admin/comments', ...staff, validate({ query: v.moderationQuery }), c.adminComments);
router.get('/admin/:id', ...staff, validate({ params: idParams }), c.adminGet);
router.post('/', ...staff, validate({ body: v.createPostBody }), c.create);
router.patch('/comments/:id', ...staff, validate({ params: idParams, body: v.moderateBody }), c.moderate);
router.patch('/:id', ...staff, validate({ params: idParams, body: v.updatePostBody }), c.update);
router.delete('/:id', ...staff, validate({ params: idParams }), c.archive);

// Comments: report / delete (own, or any for moderators)
router.post('/comments/:id/report', authenticate, validate({ params: idParams, body: v.reportBody }), c.report);
router.delete('/comments/:id', authenticate, validate({ params: idParams }), c.removeComment);

// One post
router.get('/:slug', validate({ params: v.slugParams }), c.getOne);
router.get('/:slug/comments', validate({ params: v.slugParams }), c.comments);
router.get('/:slug/state', authenticate, validate({ params: v.slugParams }), c.state);
router.post('/:slug/like', authenticate, validate({ params: v.slugParams }), c.like);
router.post('/:slug/bookmark', authenticate, validate({ params: v.slugParams }), c.bookmark);
router.post('/:slug/comments', authenticate, commentLimiter, validate({ params: v.slugParams, body: v.commentBody }), c.addComment);

export default router;
