import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import RichText from '../../components/RichText.jsx';
import MarkdownToolbar from '../../components/MarkdownToolbar.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import { blogApi } from '../../api/blog.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate } from '../../utils/format.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

const STATUS_TONE = { draft: 'slate', published: 'green', scheduled: 'amber', archived: 'slate' };

function PostForm({ post, onClose, onSaved }) {
  const { t } = useTranslation();
  const editing = Boolean(post);
  const [error, setError] = useState(null);
  const [picking, setPicking] = useState(false);
  const area = useRef(null);
  const { register, handleSubmit, watch, setValue, getValues, formState: { isSubmitting } } = useForm({
    defaultValues: post ? { ...post, tagsText: (post.tags || []).join(', '), publishAtLocal: post.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : '' }
      : { title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', category: 'General', tagsText: '', status: 'draft', publishAtLocal: '', isFeatured: false, seoTitle: '', seoDescription: '' },
  });
  const status = watch('status');
  const content = watch('content');

  const submit = async (v) => {
    setError(null);
    const body = {
      title: v.title.trim(), ...(v.slug?.trim() && { slug: v.slug.trim() }), excerpt: v.excerpt || '', content: v.content || '',
      coverImageUrl: v.coverImageUrl || '', category: v.category.trim() || 'General', tags: v.tagsText.split(',').map((x) => x.trim()).filter(Boolean),
      status: v.status, publishAt: v.publishAtLocal ? new Date(v.publishAtLocal).toISOString() : null, isFeatured: Boolean(v.isFeatured),
      seoTitle: v.seoTitle || '', seoDescription: v.seoDescription || '',
    };
    try {
      if (editing) await blogApi.update(post.id, body); else await blogApi.create(body);
      toast.success(t('cms.saved')); onSaved(); onClose();
    } catch (err) { setError(getFieldErrors(err).map((x) => `${x.field}: ${x.message}`).join(' · ') || getErrorMessage(err)); }
  };

  return (
    <Modal open onClose={onClose} title={editing ? t('blog.editPost') : t('blog.newPost')} size="lg">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="label">{t('cms.fields.title')}</span><input className="field" required minLength={3} maxLength={160} {...register('title')} /></label>
          <label className="block"><span className="label">{t('blog.slug')}</span><input className="field font-mono text-sm" placeholder={t('blog.slugAuto')} maxLength={100} {...register('slug')} /></label>
          <label className="block"><span className="label">{t('cms.fields.category')}</span><input className="field" maxLength={60} {...register('category')} /></label>
          <label className="block sm:col-span-2"><span className="label">{t('blog.excerpt')}</span><textarea className="field" rows={2} maxLength={400} {...register('excerpt')} /></label>
          <div className="sm:col-span-2">
            <span className="label">{t('cms.fields.imageUrl')}</span>
            <div className="flex gap-2"><input className="field" value={watch('coverImageUrl')} onChange={(e) => setValue('coverImageUrl', e.target.value, { shouldDirty: true })} placeholder="https://…" /><button type="button" className="btn-secondary shrink-0" onClick={() => setPicking(true)}>{t('media.choose')}</button></div>
            <MediaPicker open={picking} onClose={() => setPicking(false)} purpose="blog" onPick={(url) => setValue('coverImageUrl', url, { shouldDirty: true })} />
          </div>
          <label className="block sm:col-span-2"><span className="label">{t('blog.tags')}</span><input className="field" placeholder="tips, admission" {...register('tagsText')} /></label>
        </div>

        <div>
          <span className="label">{t('cms.fields.content')}</span>
          <MarkdownToolbar textareaRef={area} value={content} onChange={(v) => setValue('content', v, { shouldDirty: true })} />
          <textarea ref={area} className="field font-mono text-sm" rows={12} maxLength={50000} {...register('content')} />
        </div>
        <details className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><summary className="cursor-pointer text-sm font-medium">{t('cms.preview')}</summary><div className="mt-3"><RichText content={content} /></div></details>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block"><span className="label">{t('bookings.statusLabel')}</span><select className="field" {...register('status')}>{['draft', 'published', 'scheduled', 'archived'].map((s) => <option key={s} value={s}>{t(`blog.status.${s}`)}</option>)}</select></label>
          {(status === 'scheduled' || status === 'published') && <label className="block sm:col-span-2"><span className="label">{t('blog.publishAt')}</span><input type="datetime-local" className="field" {...register('publishAtLocal')} /></label>}
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" {...register('isFeatured')} />{t('cms.fields.isFeatured')}</label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">{t('blog.seoTitle')}</span><input className="field" maxLength={70} {...register('seoTitle')} /></label>
          <label className="block"><span className="label">{t('blog.seoDescription')}</span><input className="field" maxLength={160} {...register('seoDescription')} /></label>
        </div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" loading={isSubmitting}>{t('common.save')}</Button></div>
      </form>
    </Modal>
  );
}
export default function BlogAdmin() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [toArchive, setToArchive] = useState(null);
  const q = useDebounce(search);
  const params = { page, limit: 15, ...(status && { status }), ...(q && { q }) };
  const { data, meta, loading, error, reload } = useFetch(() => blogApi.adminList(params), [JSON.stringify(params)]);

  const archive = async () => {
    try { await blogApi.archive(toArchive.id); toast.success(t('cms.deleted')); reload(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('blog.manageTitle')}</h1><Button onClick={() => setForm('new')}><Plus size={16} />{t('blog.newPost')}</Button></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('cms.search')} aria-label={t('cms.search')} /></div>
        <select className="field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('bookings.statusLabel')}><option value="">{t('public.hostelType.all')}</option>{['draft', 'published', 'scheduled', 'archived'].map((s) => <option key={s} value={s}>{t(`blog.status.${s}`)}</option>)}</select>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['cms.fields.title', 'cms.fields.category', 'bookings.statusLabel', 'blog.publishAt', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.title}{p.isFeatured && <Badge tone="amber" className="ml-2">{t('blog.featured')}</Badge>}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[p.status]}>{t(`blog.status.${p.status}`)}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3">{p.publishAt ? formatDate(p.publishAt, i18n.language) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right"><button className="btn-ghost py-1.5" onClick={() => setForm(p)}>{t('staff.edit')}</button><button className="btn-ghost py-1.5 text-red-600" onClick={() => setToArchive(p)}>{t('staff.archive')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      {form && <PostForm post={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={reload} />}
      <ConfirmDialog open={Boolean(toArchive)} onClose={() => setToArchive(null)} danger title={t('staff.archive')} message={t('blog.archiveConfirm')} confirmLabel={t('staff.archive')} onConfirm={archive} />
    </div>
  );
}
