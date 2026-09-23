import { useTranslation } from 'react-i18next';
import DataState from '../../components/DataState.jsx';
import BlogPostCard from '../../components/BlogPostCard.jsx';
import { blogApi } from '../../api/blog.js';
import { useFetch } from '../../hooks/useFetch.js';

export default function MyBookmarks() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => blogApi.myBookmarks(), []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('blog.myBookmarks')}</h1>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={3} skeletonClass="h-64">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.map((p) => <BlogPostCard key={p.id} post={p} />)}</div>
      </DataState>
    </div>
  );
}
