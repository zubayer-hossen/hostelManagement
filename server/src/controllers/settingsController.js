import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as settingsService from '../services/settingsService.js';
import { logAudit } from '../services/auditService.js';

/** Public: everything in SiteSetting is intentionally publishable (branding, contact, theme, SEO). */
export const getPublic = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await settingsService.getSettings() });
});

export const update = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);
  await logAudit({ req, action: 'settings.updated', entity: 'SiteSetting', entityId: settings._id, metadata: { sections: Object.keys(req.body) } });
  sendSuccess(res, { message: 'Settings saved', data: settings });
});
