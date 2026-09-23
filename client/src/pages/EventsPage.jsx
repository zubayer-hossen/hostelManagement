import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import DataState from '../components/DataState.jsx';
import EventCard from '../components/EventCard.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function EventsPage() {
  const { t } = useTranslation();
  usePageTitle(t('public.events.title'));
  const [when, setWhen] = useState('upcoming');
  const { data, loading, error, reload } = useFetch(() => contentApi.events({ when, limit: 50 }), [when]);
  return (
    <>
      <PageHeader title={t('public.events.title')} subtitle={t('public.events.subtitle')} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div role="tablist" className="mb-6 flex gap-2">
          {['upcoming', 'past'].map((w) => <button key={w} role="tab" aria-selected={when === w} onClick={() => setWhen(w)} className={`rounded-full px-4 py-2 text-sm font-semibold ${when === w ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'}`}>{t(`public.events.${w}`)}</button>)}
        </div>
        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={3} skeletonClass="h-64">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.map((e) => <EventCard key={e.id} event={e} />)}</div>
        </DataState>
      </div>
    </>
  );
}
