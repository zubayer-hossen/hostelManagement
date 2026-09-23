import { SiteSetting } from '../models/SiteSetting.js';
import { flattenToDotPaths } from '../utils/object.js';

/** Returns the singleton settings document, creating it with defaults on first use (race-safe). */
export async function getSettings() {
  let doc = await SiteSetting.findOne({ key: 'main' });
  if (!doc) {
    try {
      doc = await SiteSetting.create({ key: 'main' });
    } catch (err) {
      if (err?.code !== 11000) throw err;
      doc = await SiteSetting.findOne({ key: 'main' }); // another request created it first
    }
  }
  return doc;
}

export async function getHostelName() {
  const s = await SiteSetting.findOne({ key: 'main' }).select('general.hostelName').lean();
  return s?.general?.hostelName || 'Digital Hostel';
}

/** Partial update: only the provided leaf fields change. */
export async function updateSettings(patch) {
  await getSettings();
  return SiteSetting.findOneAndUpdate(
    { key: 'main' },
    { $set: flattenToDotPaths(patch) },
    { new: true, runValidators: true }
  );
}
