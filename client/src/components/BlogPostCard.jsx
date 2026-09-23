import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from './ui/Badge.jsx';
import { formatDate } from '../utils/format.js';

export default function BlogPostCard({ post }) {
  const { t, i18n } = useTranslation();
  return (
    <article className="card group flex h-full flex-col overflow-hidden !p-0 transition hover:shadow-glow">
      <Link to={`/blog/${post.slug}`} className="flex flex-1 flex-col">
        {post.coverImageUrl && <img src={post.coverImageUrl} alt="" loading="lazy" className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" />}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge tone="primary">{post.category}</Badge>
            {post.isFeatured && <Badge tone="amber">{t('blog.featured')}</Badge>}
            <time dateTime={post.publishAt}>{formatDate(post.publishAt, i18n.language)}</time>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
          {post.excerpt && <p className="mt-1 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{post.excerpt}</p>}
          <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-slate-500">
            <span>{post.authorName}</span>
            <span className="ml-auto flex items-center gap-1"><Heart size={13} />{post.likeCount}</span>
            <span className="flex items-center gap-1"><MessageCircle size={13} />{post.commentCount}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
