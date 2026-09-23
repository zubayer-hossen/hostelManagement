import { useTranslation } from 'react-i18next';
import { trackingApi } from '../api/tracking.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate } from '../utils/format.js';

/** "● 24 online now · 1,250 visitors today · 25,400 since 12 Jan" — real counts, each one switchable in Settings. */
export default function VisitorBadge() {
  const { t, i18n } = useTranslation();
  const { data } = useFetch(() => trackingApi.stats(), []);
  if (!data) return null;
  const nf = new Intl.NumberFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-US');
  const parts = [];
  if (typeof data.onlineNow === 'number') parts.push(<span key="o" className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />{t('visitors.online', { n: nf.format(data.onlineNow) })}</span>);
  if (typeof data.today === 'number') parts.push(<span key="d">{t('visitors.today', { n: nf.format(data.today) })}</span>);
  if (typeof data.total === 'number') parts.push(<span key="t">{t('visitors.total', { n: nf.format(data.total) })}{data.since && ` ${t('visitors.since', { date: formatDate(data.since, i18n.language) })}`}</span>);
  if (!parts.length) return null;
  return (
    <div className="border-y border-slate-200 bg-white py-3 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300" role="status" aria-live="off">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4">{parts}</div>
    </div>
  );
}
