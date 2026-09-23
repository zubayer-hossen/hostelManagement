import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import DataState from '../components/DataState.jsx';
import FacilityCard from '../components/FacilityCard.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Facilities() {
  const { t } = useTranslation();
  usePageTitle(t('public.facilities.title'));
  const [type, setType] = useState('all');
  const { data, loading, error, reload } = useFetch(() => contentApi.facilities(type === 'all' ? {} : { hostelType: type }), [type]);

  return (
    <>
      <PageHeader title={t('public.facilities.title')} subtitle={t('public.facilities.subtitle')} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div role="tablist" className="mb-8 flex flex-wrap gap-2">
          {['all', 'boys', 'girls'].map((v) => (
            <button key={v} role="tab" aria-selected={type === v} onClick={() => setType(v)} className={`rounded-full px-4 py-2 text-sm font-semibold ${type === v ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'}`}>
              {t(`public.hostelType.${v}`)}
            </button>
          ))}
        </div>
        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={6} skeletonClass="h-44">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.map((f, i) => <FacilityCard key={f.id} facility={f} index={i} />)}</div>
        </DataState>
      </div>
    </>
  );
}
