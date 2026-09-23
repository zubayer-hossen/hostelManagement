import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { warningsApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDate } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const SEV = { low: 'slate', medium: 'amber', high: 'red' };

export default function ResidentWarnings() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => warningsApi.mine(), []);
  const [busy, setBusy] = useState(null);

  const ack = async (id) => {
    setBusy(id);
    try { await warningsApi.acknowledge(id); toast.success(t('warnings.acknowledged')); reload(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('warnings.myTitle')}</h1>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={2} skeletonClass="h-28">
        <ul className="space-y-4">
          {data?.map((w) => (
            <li key={w.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={SEV[w.severity]}>{t(`warnings.severity.${w.severity}`)}</Badge>
                <Badge>{t(`warnings.types.${w.type}`)}</Badge>
                <Badge tone={w.status === 'active' ? 'red' : 'green'}>{t(`warnings.status.${w.status}`)}</Badge>
                <span className="text-xs text-slate-500">{formatDate(w.createdAt, i18n.language)}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold">{w.reason}</h2>
              {w.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{w.description}</p>}
              {w.resolutionNote && <p className="mt-2 text-sm"><strong>{t('warnings.resolution')}:</strong> {w.resolutionNote}</p>}
              {w.status === 'active' && <div className="mt-3 text-right"><Button variant="secondary" loading={busy === w.id} onClick={() => ack(w.id)}>{t('warnings.acknowledge')}</Button></div>}
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  );
}
