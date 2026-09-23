import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Bookmark, Heart } from 'lucide-react';
import DataState from '../../components/DataState.jsx';
import RichText from '../../components/RichText.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ShareMenu from '../../components/ShareMenu.jsx';
import CommentThread from '../../components/CommentThread.jsx';
import { blogApi } from '../../api/blog.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { formatDate } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

function Interactions({ post }) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: state, reload: reloadState } = useFetch(() => (isAuthenticated ? blogApi.state(post.slug) : Promise.resolve({ data: { liked: false, bookmarked: false } })), [post.slug, isAuthenticated]);
  const [counts, setCounts] = useState({ likeCount: post.likeCount });
  const url = `${window.location.origin}/blog/${post.slug}`;

  const toggle = async (kind) => {
    if (!isAuthenticated) { toast.error(t('blog.loginToInteract')); return; }
    try {
      const res = kind === 'like' ? await blogApi.like(post.slug) : await blogApi.bookmark(post.slug);
      if (kind === 'like') setCounts((c) => ({ likeCount: c.likeCount + (res.data.liked ? 1 : -1) }));
      reloadState();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={() => toggle('like')} className={`btn-secondary ${state?.liked ? '!border-red-400 !text-red-600' : ''}`}><Heart size={16} className={state?.liked ? 'fill-red-500 text-red-500' : ''} />{counts.likeCount} {t('blog.likes')}</button>
      <button onClick={() => toggle('bookmark')} className={`btn-secondary ${state?.bookmarked ? '!border-primary-400 !text-primary-600' : ''}`}><Bookmark size={16} className={state?.bookmarked ? 'fill-primary-500 text-primary-500' : ''} />{t('blog.bookmark')}</button>
      <ShareMenu url={url} title={post.title} />
      <span className="ml-auto text-xs text-slate-500">{formatDate(post.publishAt, i18n.language)}</span>
    </div>
  );
}

function Comments({ slug }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data, loading, error, reload } = useFetch(() => blogApi.comments(slug), [slug]);
  const [text, setText] = useState('');
  const [parent, setParent] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await blogApi.addComment(slug, { text: text.trim(), ...(parent && { parent: parent.id }) }); setText(''); setParent(null); reload(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold">{t('blog.comments')}</h2>
      {isAuthenticated ? (
        <form onSubmit={submit} className="mb-4 space-y-2">
          {parent && <p className="text-xs text-slate-500">{t('blog.replyingTo', { name: parent.userName })} <button type="button" className="underline" onClick={() => setParent(null)}>{t('common.cancel')}</button></p>}
          <textarea className="field" rows={3} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('blog.addComment')} aria-label={t('blog.addComment')} />
          <Button type="submit" loading={busy} disabled={!text.trim()}>{t('blog.postComment')}</Button>
        </form>
      ) : <p className="mb-4 text-sm text-slate-500">{t('blog.loginToComment')} <Link to="/login" className="font-semibold text-primary-600 underline">{t('common.login')}</Link></p>}
      <DataState loading={loading} error={error} onRetry={reload} skeletons={2} skeletonClass="h-16">
        {data && <CommentThread comments={data} onReply={setParent} onChanged={reload} />}
      </DataState>
    </section>
  );
}

export default function BlogPostPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { data: post, loading, error, notFound, reload } = useFetch(() => blogApi.get(slug), [slug]);
  usePageTitle(post?.title || t('blog.title'), post ? { description: post.seoDescription || post.excerpt, image: post.coverImageUrl, type: 'article' } : undefined);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <DataState loading={loading} error={error} empty={notFound} onRetry={reload} skeletons={1} skeletonClass="h-96">
        {post && (
          <article>
            <div className="mb-4 flex flex-wrap gap-2"><Badge tone="primary">{post.category}</Badge>{post.tags?.map((tg) => <Badge key={tg}>#{tg}</Badge>)}</div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{post.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{t('blog.by', { name: post.authorName })}</p>
            {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="my-6 w-full rounded-2xl object-cover" />}
            <RichText content={post.content} />
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800"><Interactions post={post} /></div>
            <Comments slug={post.slug} />
          </article>
        )}
      </DataState>
    </div>
  );
}
