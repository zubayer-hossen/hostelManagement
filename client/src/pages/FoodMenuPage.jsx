import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import DataState from '../components/DataState.jsx';
import FoodMenuBoard from '../components/FoodMenuBoard.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function FoodMenuPage() {
  const { t } = useTranslation();
  usePageTitle(t('public.food.title'));
  const [type, setType] = useState('all');
  const { data, loading, error, reload } = useFetch(() => contentApi.foodMenu({}), []);

  return (
    <>
      <PageHeader title={t('public.food.title')} subtitle={t('public.food.subtitle')} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div role="tablist" className="mb-6 flex flex-wrap gap-2">
          {['all', 'boys', 'girls'].map((v) => (
            <button key={v} role="tab" aria-selected={type === v} onClick={() => setType(v)} className={`rounded-full px-4 py-2 text-sm font-semibold ${type === v ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'}`}>
              {t(`public.hostelType.${v}`)}
            </button>
          ))}
        </div>
        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-44">
          {data && <FoodMenuBoard menu={data} hostelType={type} />}
        </DataState>
      </div>
    </>
  );
}
