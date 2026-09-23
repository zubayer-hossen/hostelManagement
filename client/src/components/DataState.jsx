import { AlertTriangle, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Skeleton from './ui/Skeleton.jsx';

/** Standard loading / error / empty handling so every data section behaves the same way. */
export default function DataState({ loading, error, empty, onRetry, skeletons = 3, skeletonClass = 'h-40', children }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div role="status" aria-label={t('common.loading')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletons }).map((_, i) => <Skeleton key={i} className={skeletonClass} />)}
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="card flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="text-amber-500" />
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('public.loadError')}</p>
        {onRetry && <button className="btn-secondary" onClick={onRetry}>{t('common.retry')}</button>}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="card flex flex-col items-center gap-3 py-10 text-center text-slate-500">
        <Inbox />
        <p className="text-sm">{t('public.empty')}</p>
      </div>
    );
  }
  return children;
}
