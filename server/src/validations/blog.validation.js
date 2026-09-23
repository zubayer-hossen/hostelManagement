import { z } from 'zod';
import { objectId, paginationQuery } from './common.js';

const t = (max) => z.string().trim().max(max);
const link = z.string().trim().max(1000).refine((v) => v === '' || /^(https?:\/\/|\/)\S*$/i.test(v), 'Must be an http(s) URL');
const tags = z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10);

export const postFields = z.object({
  title: t(160).min(3),
  slug: z.string().trim().toLowerCase().regex(/^[\p{L}\p{N}]+(-[\p{L}\p{N}]+)*$/u, 'Use letters, numbers and dashes').max(100).optional(),
  excerpt: t(400), content: t(50000), coverImageUrl: link, category: t(60).min(1), tags,
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  publishAt: z.coerce.date().nullable(),
  isFeatured: z.boolean(), seoTitle: t(70), seoDescription: t(160),
});
export const createPostBody = postFields.partial().required({ title: true }).refine((d) => d.status !== 'scheduled' || d.publishAt, { message: 'Choose a publish date for a scheduled post', path: ['publishAt'] });
export const updatePostBody = postFields.partial().refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export const slugParams = z.object({ slug: z.string().trim().min(1).max(120) });
export const listPostsQuery = paginationQuery.extend({
  limit: z.coerce.number().int().min(1).max(50).default(9),
  category: t(60).optional(), tag: t(30).optional(), q: t(80).optional(), featured: z.enum(['true', 'false']).optional(),
});
export const adminPostsQuery = listPostsQuery.extend({ status: z.enum(['draft', 'published', 'scheduled', 'archived']).optional() });
export const commentBody = z.object({ text: t(1500).min(1), parent: objectId.optional() });
export const reportBody = z.object({ reason: t(200).default('') });
export const commentIdParams = z.object({ id: objectId });
export const moderationQuery = paginationQuery.extend({ status: z.enum(['visible', 'hidden', 'deleted']).optional(), reported: z.enum(['true', 'false']).optional() });
export const moderateBody = z.object({ status: z.enum(['visible', 'hidden']) });
