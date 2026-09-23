import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true, maxlength: 80 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogComment', default: null }, // one level of replies
    text: { type: String, required: true, trim: true, maxlength: 1500 },
    status: { type: String, enum: ['visible', 'hidden', 'deleted'], default: 'visible' },
    reportCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, status: 1, createdAt: 1 });
commentSchema.index({ status: 1, reportCount: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.set('toJSON', jsonTransform);

export const BlogComment = mongoose.model('BlogComment', commentSchema);

const pairSchema = (name) => {
  const s = new mongoose.Schema({ post: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: { createdAt: true, updatedAt: false } });
  s.index({ post: 1, user: 1 }, { unique: true });
  s.index({ user: 1, createdAt: -1 });
  return mongoose.model(name, s);
};
export const BlogLike = pairSchema('BlogLike');
export const BlogBookmark = pairSchema('BlogBookmark');

const reportSchema = new mongoose.Schema({ comment: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogComment', required: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, reason: { type: String, maxlength: 200, default: '' } }, { timestamps: { createdAt: true, updatedAt: false } });
reportSchema.index({ comment: 1, user: 1 }, { unique: true });
export const CommentReport = mongoose.model('CommentReport', reportSchema);
