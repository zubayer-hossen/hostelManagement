import { PageContent } from '../models/PageContent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../services/auditService.js';

export const getPage = asyncHandler(async (req, res) => {
  const page = await PageContent.findOne({ key: req.params.key });
  if (!page) throw ApiError.notFound('Page has not been published yet');
  res.set('Cache-Control', 'public, max-age=30');
  sendSuccess(res, { data: page });
});

export const savePage = asyncHandler(async (req, res) => {
  const page = await PageContent.findOneAndUpdate(
    { key: req.params.key },
    { $set: { title: req.body.title, content: req.body.content, updatedBy: req.user._id }, $setOnInsert: { key: req.params.key } },
    { upsert: true, new: true, runValidators: true }
  );
  await logAudit({ req, action: 'page.updated', entity: 'PageContent', entityId: page._id, metadata: { key: page.key } });
  sendSuccess(res, { message: 'Page saved', data: page });
});
