/** Shared toJSON transform: `_id` -> `id`, no `__v`. */
export const jsonTransform = {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
};

/** Mongo filter for content that is active and inside an optional [from, to) window. */
export const activeWindow = (from = 'startsAt', to = 'endsAt', now = new Date()) => ({
  isActive: true,
  $and: [
    { $or: [{ [from]: null }, { [from]: { $exists: false } }, { [from]: { $lte: now } }] },
    { $or: [{ [to]: null }, { [to]: { $exists: false } }, { [to]: { $gt: now } }] },
  ],
});
