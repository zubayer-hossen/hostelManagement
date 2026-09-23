import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { auditApi } from '../../api/admin.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDateTime } from '../../utils/format.js';

export default function AuditLogs() {
  const { t, i18n } = useTranslation();
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const e = useDebounce(entity);
  const a = useDebounce(action);
  useEffect(() => setPage(1), [e, a]);
  const params = { page, limit: 25, ...(e && { entity: e }), ...(a && { action: a }) };
  const { data, meta, loading, error, reload } = useFetch(() => auditApi.list(params), [JSON.stringify(params)]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('admin.audit.title')}</h1>
      <div className="flex flex-wrap gap-3">
        <input className="field w-auto" value={entity} onChange={(x) => setEntity(x.target.value)} placeholder={t('admin.audit.entity')} aria-label={t('admin.audit.entity')} />
        <input className="field w-auto" value={action} onChange={(x) => setAction(x.target.value)} placeholder={t('admin.audit.action')} aria-label={t('admin.audit.action')} />
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={5} skeletonClass="h-12">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['dashboard.when', 'admin.audit.actor', 'admin.audit.action', 'admin.audit.entity', 'dashboard.ip', 'admin.audit.details'].map((h) => <th key={h} className="px-4 py-3 font-medium">{t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(l.createdAt, i18n.language)}</td>
                  <td className="px-4 py-3">{l.actor?.name || '—'} {l.actorRole && <Badge className="ml-1">{l.actorRole}</Badge>}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3">{l.entity}{l.entityId && <span className="block font-mono text-[11px] text-slate-400">{String(l.entityId).slice(-8)}</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{l.ip || '—'}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-500"><span className="line-clamp-2 break-all">{l.metadata ? JSON.stringify(l.metadata) : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
    </div>
  );
}
