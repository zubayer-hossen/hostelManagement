import { BlogPost } from '../models/BlogPost.js';
import { BlogComment, BlogLike, BlogBookmark, CommentReport } from '../models/BlogComment.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { slugify } from '../utils/slug.js';
import { logAudit } from './auditService.js';

/** Live to the public: published or scheduled posts whose publish time has arrived (no job needed — evaluated at read time). */
export const liveFilter = (now = new Date()) => ({ status: { $in: ['published', 'scheduled'] }, publishAt: { $lte: now } });
const LIST_FIELDS = '-content';

async function uniqueSlug(wanted, excludeId) {
  const base = slugify(wanted);
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    if (!(await BlogPost.exists({ slug: candidate, ...(excludeId && { _id: { $ne: excludeId } }) }))) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── public ──
export async function listPublic(q) {
  const f = liveFilter();
  if (q.category) f.category = q.category;
  if (q.tag) f.tags = q.tag.toLowerCase();
  if (q.featured === 'true') f.isFeatured = true;
  if (q.q) { const rx = new RegExp(escapeRegex(q.q), 'i'); f.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }]; }
  const [items, total] = await Promise.all([
    BlogPost.find(f).select(LIST_FIELDS).sort({ isFeatured: -1, publishAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
    BlogPost.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}

export async function getPublic(slug) {
  const post = await BlogPost.findOne({ slug, ...liveFilter() });
  if (!post) throw ApiError.notFound('Post not found');
  return post;
}

export async function categories() {
  const rows = await BlogPost.aggregate([{ $match: liveFilter() }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  return rows.map((r) => ({ name: r._id, count: r.count }));
}

export async function listComments(slug) {
  const post = await getPublic(slug);
  const all = await BlogComment.find({ post: post._id, status: 'visible' }).sort({ createdAt: 1 }).limit(500);
  const top = all.filter((c) => !c.parent).map((c) => ({ ...c.toJSON(), replies: [] }));
  const byId = new Map(top.map((c) => [c.id, c]));
  for (const c of all.filter((x) => x.parent)) byId.get(String(c.parent))?.replies.push(c.toJSON());
  return top;
}

/** Which of these posts did the signed-in user like / bookmark? */
export async function userState(userId, postId) {
  const [liked, bookmarked] = await Promise.all([BlogLike.exists({ post: postId, user: userId }), BlogBookmark.exists({ post: postId, user: userId })]);
  return { liked: Boolean(liked), bookmarked: Boolean(bookmarked) };
}

// ── interactions (signed in) ──
export async function toggleLike(user, slug) {
  const post = await getPublic(slug);
  const removed = await BlogLike.deleteOne({ post: post._id, user: user._id });
  if (removed.deletedCount) {
    await BlogPost.updateOne({ _id: post._id, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
    return { liked: false };
  }
  try {
    await BlogLike.create({ post: post._id, user: user._id });
    await BlogPost.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });
  } catch (err) { if (err?.code !== 11000) throw err; } // double-click: already liked
  return { liked: true };
}

export async function toggleBookmark(user, slug) {
  const post = await getPublic(slug);
  const removed = await BlogBookmark.deleteOne({ post: post._id, user: user._id });
  if (removed.deletedCount) return { bookmarked: false };
  try { await BlogBookmark.create({ post: post._id, user: user._id }); } catch (err) { if (err?.code !== 11000) throw err; }
  return { bookmarked: true };
}

export async function myBookmarks(userId) {
  const rows = await BlogBookmark.find({ user: userId }).sort({ createdAt: -1 }).limit(100).populate({ path: 'post', select: LIST_FIELDS, match: liveFilter() });
  return rows.map((r) => r.post).filter(Boolean);
}

export async function addComment(user, slug, { text, parent }, req) {
  const post = await getPublic(slug);
  if (parent) {
    const p = await BlogComment.findOne({ _id: parent, post: post._id, status: 'visible' });
    if (!p) throw ApiError.badRequest('The comment you are replying to no longer exists');
    if (p.parent) throw ApiError.badRequest('Replies can only be added to top-level comments');
  }
  const c = await BlogComment.create({ post: post._id, user: user._id, userName: user.name, parent: parent || null, text });
  await BlogPost.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
  await logAudit({ req, actor: user, action: 'comment.created', entity: 'BlogComment', entityId: c._id });
  return c;
}

export async function deleteOwnComment(user, id) {
  const c = await BlogComment.findOneAndUpdate({ _id: id, user: user._id, status: { $ne: 'deleted' } }, { $set: { status: 'deleted' } }, { new: true });
  if (!c) throw ApiError.notFound('Comment not found');
  await BlogPost.updateOne({ _id: c.post, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
}

export async function reportComment(user, id, reason) {
  const c = await BlogComment.findOne({ _id: id, status: 'visible' });
  if (!c) throw ApiError.notFound('Comment not found');
  if (String(c.user) === String(user._id)) throw ApiError.badRequest('You cannot report your own comment');
  try {
    await CommentReport.create({ comment: c._id, user: user._id, reason });
    await BlogComment.updateOne({ _id: c._id }, { $inc: { reportCount: 1 } });
  } catch (err) { if (err?.code !== 11000) throw err; } // one report per person
}

// ── staff (manageBlogs) ──
export async function listAdmin(q) {
  const f = {};
  if (q.status) f.status = q.status;
  if (q.category) f.category = q.category;
  if (q.q) { const rx = new RegExp(escapeRegex(q.q), 'i'); f.$or = [{ title: rx }, { tags: rx }]; }
  const [items, total] = await Promise.all([
    BlogPost.find(f).select(LIST_FIELDS).sort({ updatedAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
    BlogPost.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}
export async function getAdmin(id) {
  const p = await BlogPost.findById(id);
  if (!p) throw ApiError.notFound('Post not found');
  return p;
}

/** Publishing without a date means "now". A scheduled post keeps its future date. */
const normalisePublish = (data, existing) => {
  const status = data.status ?? existing?.status ?? 'draft';
  if (['published', 'scheduled'].includes(status) && !(data.publishAt ?? existing?.publishAt)) data.publishAt = new Date();
  return data;
};

export async function createPost(actor, data, req) {
  const slug = await uniqueSlug(data.slug || data.title);
  const post = await BlogPost.create({ ...normalisePublish({ ...data }), slug, author: actor._id, authorName: actor.name });
  await logAudit({ req, action: 'blog.created', entity: 'BlogPost', entityId: post._id, metadata: { status: post.status } });
  return post;
}
export async function updatePost(actor, id, data, req) {
  const post = await getAdmin(id);
  if (data.slug && data.slug !== post.slug) data.slug = await uniqueSlug(data.slug, post._id);
  post.set(normalisePublish({ ...data }, post));
  await post.save();
  await logAudit({ req, action: 'blog.updated', entity: 'BlogPost', entityId: post._id, metadata: { fields: Object.keys(data) } });
  return post;
}
/** "Delete" archives the post (it disappears from the site but nothing is lost). */
export async function archivePost(actor, id, req) {
  const post = await getAdmin(id);
  post.status = 'archived';
  await post.save();
  await logAudit({ req, action: 'blog.deleted', entity: 'BlogPost', entityId: post._id, metadata: { archived: true } });
}

export async function listCommentsAdmin(q) {
  const f = {};
  if (q.status) f.status = q.status;
  if (q.reported === 'true') f.reportCount = { $gt: 0 };
  const [items, total] = await Promise.all([
    BlogComment.find(f).sort(q.reported === 'true' ? { reportCount: -1, createdAt: -1 } : { createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('post', 'title slug'),
    BlogComment.countDocuments(f),
  ]);
  return { items, pagination: buildPagination({ page: q.page, limit: q.limit, total }) };
}
export async function moderateComment(actor, id, status, req) {
  const c = await BlogComment.findById(id);
  if (!c || c.status === 'deleted') throw ApiError.notFound('Comment not found');
  const wasVisible = c.status === 'visible';
  c.status = status;
  await c.save();
  if (wasVisible && status === 'hidden') await BlogPost.updateOne({ _id: c.post, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
  if (!wasVisible && status === 'visible') await BlogPost.updateOne({ _id: c.post }, { $inc: { commentCount: 1 } });
  await logAudit({ req, action: `comment.${status}`, entity: 'BlogComment', entityId: c._id });
  return c;
}
export async function deleteCommentAdmin(actor, id, req) {
  const c = await BlogComment.findById(id);
  if (!c || c.status === 'deleted') throw ApiError.notFound('Comment not found');
  if (c.status === 'visible') await BlogPost.updateOne({ _id: c.post, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
  c.status = 'deleted';
  await c.save();
  await logAudit({ req, action: 'comment.deleted', entity: 'BlogComment', entityId: c._id });
}
