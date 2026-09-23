import mongoose from 'mongoose';
import { jsonTransform } from '../utils/schemaOptions.js';

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, maxlength: 100 },
    excerpt: { type: String, trim: true, maxlength: 400, default: '' },
    content: { type: String, trim: true, maxlength: 50000, default: '' }, // markdown-lite, rendered safely by the client
    coverImageUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    category: { type: String, trim: true, maxlength: 60, default: 'General' },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, maxlength: 80, default: '' },
    status: { type: String, enum: ['draft', 'published', 'scheduled', 'archived'], default: 'draft' },
    publishAt: { type: Date, default: null },           // published/scheduled posts go live when publishAt <= now
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String, trim: true, maxlength: 70, default: '' },
    seoDescription: { type: String, trim: true, maxlength: 160, default: '' },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

blogPostSchema.index({ slug: 1 }, { unique: true });
blogPostSchema.index({ status: 1, publishAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ isFeatured: -1, publishAt: -1 });
blogPostSchema.set('toJSON', jsonTransform);

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
