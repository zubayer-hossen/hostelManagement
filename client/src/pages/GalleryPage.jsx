import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import DataState from '../components/DataState.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function GalleryPage() {
  const { t } = useTranslation();
  usePageTitle(t('public.gallery.title'));
  const { data, loading, error, reload } = useFetch(() => contentApi.gallery({ limit: 200 }), []);
  const [category, setCategory] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  const categories = useMemo(() => [...new Set((data || []).map((i) => i.category))], [data]);
  const items = useMemo(() => (data || []).filter((i) => category === 'all' || i.category === category), [data, category]);

  return (
    <>
      <PageHeader title={t('public.gallery.title')} subtitle={t('public.gallery.subtitle')} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={6} skeletonClass="h-52">
          {categories.length > 1 && (
            <div role="tablist" className="mb-6 flex flex-wrap gap-2">
              {['all', ...categories].map((c) => (
                <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === c ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {c === 'all' ? t('public.gallery.all') : t(`public.gallery.categories.${c}`)}
                </button>
              ))}
            </div>
          )}
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {items.map((item, i) => (
              <button key={item.id} onClick={() => setLightbox(i)} className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl" aria-label={item.title || t('public.gallery.preview')}>
                <img src={item.imageUrl} alt={item.title || item.category} loading="lazy" className="w-full object-cover transition duration-300 group-hover:scale-105" />
                {item.title && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 text-left text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">{item.title}</span>}
              </button>
            ))}
          </div>
        </DataState>
      </div>
      {lightbox !== null && <Lightbox items={items} index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />}
    </>
  );
}
