import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader.jsx';
import DataState from '../../components/DataState.jsx';
import BlogPostCard from '../../components/BlogPostCard.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { blogApi } from '../../api/blog.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

export default function BlogListPage() {
  const { t } = useTranslation();
  usePageTitle(t('blog.title'));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const { data: cats } = useFetch(() => blogApi.categories(), []);
  const params = { page, ...(q && { q }), ...(category && { category }) };
  const { data, meta, loading, error, reload } = useFetch(() => blogApi.list(params), [JSON.stringify(params)]);

  return (
    <>
      <PageHeader title={t('blog.title')} subtitle={t('blog.subtitle')} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <input type="search" className="field max-w-xs" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('cms.search')} aria-label={t('cms.search')} />
          {cats?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setCategory(''); setPage(1); }} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!category ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{t('public.gallery.all')}</button>
              {cats.map((c) => <button key={c.name} onClick={() => { setCategory(c.name); setPage(1); }} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${category === c.name ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{c.name} ({c.count})</button>)}
            </div>
          )}
        </div>
        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={6} skeletonClass="h-72">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.map((p) => <BlogPostCard key={p.id} post={p} />)}</div>
          <Pagination meta={meta} onPage={setPage} />
        </DataState>
      </div>
    </>
  );
}
