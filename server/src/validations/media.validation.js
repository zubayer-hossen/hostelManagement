import { z } from 'zod';
import { MEDIA_PURPOSES } from '../models/Media.js';
import { paginationQuery } from './common.js';

export const uploadBody = z.object({ purpose: z.enum(MEDIA_PURPOSES).default('general'), altText: z.string().trim().max(200).default('') });
export const listMediaQuery = paginationQuery.extend({ search: z.string().trim().max(80).optional(), purpose: z.enum(MEDIA_PURPOSES).optional() });
export const updateMediaBody = z.object({ altText: z.string().trim().max(200).optional(), purpose: z.enum(MEDIA_PURPOSES).optional() }).refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });
