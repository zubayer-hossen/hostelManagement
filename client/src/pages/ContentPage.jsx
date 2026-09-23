import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import RichText from '../components/RichText.jsx';
import DataState from '../components/DataState.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatDate } from '../utils/format.js';

/** Renders an admin-editable page (about / rules / terms / privacy). */
export default function ContentPage({ pageKey, titleKey, showUpdated = false }) {
  const { t, i18n } = useTranslation();
  const { data, loading, error, notFound, reload } = useFetch(() => contentApi.page(pageKey), [pageKey]);
  const title = data?.title || t(titleKey);
  usePageTitle(title);

  return (
    <>
      <PageHeader title={title} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <DataState loading={loading} error={error} empty={notFound} onRetry={reload} skeletons={1} skeletonClass="h-64">
          {data && (
            <article className="card">
              <RichText content={data.content} />
              {showUpdated && <p className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800">{t('public.lastUpdated')}: {formatDate(data.updatedAt, i18n.language)}</p>}
            </article>
          )}
        </DataState>
      </div>
    </>
  );
}
