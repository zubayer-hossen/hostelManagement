import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import DataState from '../components/DataState.jsx';
import NoticeCard from '../components/NoticeCard.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NoticesPage() {
  const { t } = useTranslation();
  usePageTitle(t('public.notices.title'));
  const { data, loading, error, reload } = useFetch(() => contentApi.notices({ limit: 50 }), []);
  return (
    <>
      <PageHeader title={t('public.notices.title')} subtitle={t('public.notices.subtitle')} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload}>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data?.map((n) => <NoticeCard key={n.id} notice={n} />)}</div>
        </DataState>
      </div>
    </>
  );
}
