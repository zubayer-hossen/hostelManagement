import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { meetingsApi, MEETING_TONE } from '../../api/meetings.js';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function MyMeetings() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => meetingsApi.mine(), []);
  const [toCancel, setToCancel] = useState(null);
  const cancel = async (reason) => {
    try { await meetingsApi.cancel(toCancel.id, reason); toast.success(t('meetings.cancelled')); reload(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('meetings.myTitle')}</h1><Link to="/meetings" className="btn-primary">{t('meetings.book')}</Link></div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={2} skeletonClass="h-20">
        <ul className="space-y-3">
          {data?.map((m) => (
            <li key={m.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold">{m.date} · {m.time}</p><p className="text-sm text-slate-500">{t(`meetings.types.${m.type}`)}{m.reason && ` — ${m.reason}`}</p>{m.type === 'audio' && m.status === 'confirmed' && <p className="text-xs text-slate-500">{t('meetings.phoneNote')}</p>}</div>
              <div className="flex items-center gap-3"><Badge tone={MEETING_TONE[m.status]}>{t(`meetings.status.${m.status}`)}</Badge>
                {m.status === 'confirmed' && new Date(m.startsAt) > new Date() && <button className="btn-secondary py-1.5" onClick={() => setToCancel(m)}>{t('common.cancel')}</button>}</div>
            </li>
          ))}
        </ul>
      </DataState>
      <ConfirmDialog open={Boolean(toCancel)} onClose={() => setToCancel(null)} danger withReason title={t('meetings.cancelTitle')} message={t('meetings.cancelConfirm')} confirmLabel={t('meetings.cancelTitle')} onConfirm={cancel} />
    </div>
  );
}
