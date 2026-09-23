import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { blogApi } from '../../api/blog.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function BlogCommentsAdmin() {
  const { t, i18n } = useTranslation();
  const [reported, setReported] = useState(true);
  const [page, setPage] = useState(1);
  const params = { page, limit: 20, ...(reported && { reported: 'true' }) };
  const { data, meta, loading, error, reload } = useFetch(() => blogApi.adminComments(params), [JSON.stringify(params)]);

  const moderate = async (id, status) => {
    try { await blogApi.moderate(id, status); toast.success(t('cms.saved')); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const remove = async (id) => {
    try { await blogApi.deleteComment(id); toast.success(t('cms.deleted')); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('blog.commentsTitle')}</h1>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reported} onChange={(e) => { setReported(e.target.checked); setPage(1); }} />{t('blog.reportedOnly')}</label>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={3} skeletonClass="h-20">
        <ul className="space-y-3">
          {data?.map((c) => (
            <li key={c.id} className="card">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-200">{c.userName}</span>
                <span>{formatDateTime(c.createdAt, i18n.language)}</span>
                {c.post && <Link to={`/blog/${c.post.slug}`} target="_blank" className="text-primary-600 underline">{c.post.title}</Link>}
                {c.reportCount > 0 && <Badge tone="red">{t('blog.reportedN', { n: c.reportCount })}</Badge>}
                <Badge tone={c.status === 'visible' ? 'green' : 'slate'}>{t(`blog.commentStatus.${c.status}`)}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm">{c.text}</p>
              <div className="mt-3 flex gap-2">
                {c.status !== 'visible' && <button className="btn-secondary py-1.5" onClick={() => moderate(c.id, 'visible')}>{t('blog.approve')}</button>}
                {c.status !== 'hidden' && <button className="btn-secondary py-1.5" onClick={() => moderate(c.id, 'hidden')}>{t('blog.hide')}</button>}
                <button className="btn-ghost py-1.5 text-red-600" onClick={() => remove(c.id)}>{t('cms.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
    </div>
  );
}
