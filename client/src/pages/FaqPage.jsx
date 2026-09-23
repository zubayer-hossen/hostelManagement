import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import DataState from '../components/DataState.jsx';
import Accordion from '../components/Accordion.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function FaqPage() {
  const { t } = useTranslation();
  usePageTitle(t('public.faq.title'));
  const { data, loading, error, reload } = useFetch(() => contentApi.faqs({ limit: 200 }), []);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => [...new Set((data || []).map((f) => f.category))], [data]);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data || []).filter((f) => (category === 'all' || f.category === category) && (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)));
  }, [data, category, query]);

  return (
    <>
      <PageHeader title={t('public.faq.title')} subtitle={t('public.faq.subtitle')} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-16">
          <div className="relative mb-4">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('public.faq.search')} aria-label={t('public.faq.search')} className="field pl-10" />
          </div>
          {categories.length > 1 && (
            <div role="tablist" className="mb-6 flex flex-wrap gap-2">
              {['all', ...categories].map((c) => (
                <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === c ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {c === 'all' ? t('public.gallery.all') : c}
                </button>
              ))}
            </div>
          )}
          {items.length ? <Accordion items={items} /> : <p className="py-8 text-center text-slate-500">{t('public.faq.noResults')}</p>}
        </DataState>
      </div>
    </>
  );
}
