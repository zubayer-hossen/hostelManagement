import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { meetingsApi, MEETING_TONE, localToday } from '../../api/meetings.js';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../utils/errors.js';

const STATUSES = ['confirmed', 'completed', 'no_show', 'cancelled'];

export default function MeetingsAdmin() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('confirmed');
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState(null);
  const today = localToday(360);
  const params = { page, limit: 20, ...(status && { status }), ...(status === 'confirmed' && { from: today }), order: status === 'confirmed' ? 'asc' : 'desc' };
  const { data, meta, loading, error, reload } = useFetch(() => meetingsApi.list(params), [JSON.stringify(params)]);

  const outcome = async (id, s) => {
    try { await meetingsApi.outcome(id, s); toast.success(t('complaints.statusToast')); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const cancel = async (reason) => {
    try { await meetingsApi.cancel(toCancel.id, reason); toast.success(t('meetings.cancelled')); reload(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('meetings.manageTitle')}</h1>
      <select className="field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('bookings.statusLabel')}>{STATUSES.map((s) => <option key={s} value={s}>{t(`meetings.status.${s}`)}</option>)}</select>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={3} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['meetings.when', 'meetings.person', 'meetings.type', 'meetings.reason', 'bookings.statusLabel', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{m.date} · {m.time}</td>
                  <td className="px-4 py-3">{m.user?.name}<span className="block text-xs text-slate-500">{m.user?.phone || m.user?.email}</span></td>
                  <td className="px-4 py-3">{t(`meetings.types.${m.type}`)}</td>
                  <td className="max-w-xs px-4 py-3 text-slate-600 dark:text-slate-300">{m.reason || '—'}</td>
                  <td className="px-4 py-3"><Badge tone={MEETING_TONE[m.status]}>{t(`meetings.status.${m.status}`)}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {m.status === 'confirmed' && <>
                      <button className="btn-secondary py-1.5" onClick={() => outcome(m.id, 'completed')}>{t('meetings.status.completed')}</button>
                      <button className="btn-ghost py-1.5" onClick={() => outcome(m.id, 'no_show')}>{t('meetings.status.no_show')}</button>
                      <button className="btn-ghost py-1.5 text-red-600" onClick={() => setToCancel(m)}>{t('common.cancel')}</button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      <ConfirmDialog open={Boolean(toCancel)} onClose={() => setToCancel(null)} danger withReason title={t('meetings.cancelTitle')} message={t('meetings.cancelStaffConfirm')} confirmLabel={t('meetings.cancelTitle')} onConfirm={cancel} />
    </div>
  );
}
