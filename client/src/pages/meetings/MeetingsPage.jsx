import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader.jsx';
import DataState from '../../components/DataState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { meetingsApi, bookableDates, BOOKABLE_TYPES } from '../../api/meetings.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { getErrorMessage } from '../../utils/errors.js';

const dayLabel = (date, lang) => new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

function Booker({ cfg }) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const dates = bookableDates(cfg);
  const [date, setDate] = useState(dates[0] || '');
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState('');
  const [type, setType] = useState(BOOKABLE_TYPES[0]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!date) return undefined;
    let cancelled = false;
    setSlots(null); setTime('');
    meetingsApi.availability(date).then((r) => { if (!cancelled) setSlots(r.data.slots); }).catch(() => { if (!cancelled) setSlots([]); });
    return () => { cancelled = true; };
  }, [date]);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await meetingsApi.book({ date, time, type, reason });
      toast.success(t('meetings.booked'));
      navigate('/dashboard/meetings');
    } catch (err) {
      setError(getErrorMessage(err));
      if (err?.response?.data?.code === 'SLOT_FULL') meetingsApi.availability(date).then((r) => setSlots(r.data.slots)).catch(() => {});
    } finally { setBusy(false); }
  };

  if (!dates.length) return <Alert tone="info">{t('meetings.noDates')}</Alert>;

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">1. {t('meetings.pickDate')}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2" role="listbox" aria-label={t('meetings.pickDate')}>
          {dates.map((d) => <button key={d} role="option" aria-selected={date === d} onClick={() => setDate(d)} className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium ${date === d ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white hover:border-primary-400 dark:border-slate-700 dark:bg-slate-800'}`}>{dayLabel(d, i18n.language)}</button>)}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">2. {t('meetings.pickTime')}</h2>
        {slots === null ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          : slots.length === 0 ? <p className="text-sm text-slate-500">{t('meetings.noSlots')}</p>
          : <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {slots.map((s) => <button key={s.time} disabled={!s.bookable} aria-pressed={time === s.time} onClick={() => setTime(s.time)} className={`rounded-lg border px-2 py-2 text-sm font-semibold ${time === s.time ? 'border-primary-600 bg-primary-600 text-white' : s.bookable ? 'border-slate-200 hover:border-primary-400 dark:border-slate-700' : 'cursor-not-allowed border-slate-100 text-slate-300 line-through dark:border-slate-800 dark:text-slate-600'}`}>{s.time}</button>)}
            </div>}
        <p className="mt-2 text-xs text-slate-500">{t('meetings.slotNote', { minutes: cfg.slotMinutes })}</p>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">3. {t('meetings.details')}</h2>
        <label className="block"><span className="label">{t('meetings.type')}</span>
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>{BOOKABLE_TYPES.map((x) => <option key={x} value={x}>{t(`meetings.types.${x}`)}</option>)}</select></label>
        <label className="block"><span className="label">{t('meetings.reason')} ({t('common.optional')})</span><textarea className="field" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        {error && <Alert tone="error">{error}</Alert>}
        {isAuthenticated
          ? <Button loading={busy} disabled={!time} onClick={submit}>{t('meetings.confirm')}</Button>
          : <Alert tone="info" action={<Link to="/login" state={{ from: { pathname: '/meetings' } }} className="shrink-0 text-sm font-semibold underline">{t('common.login')}</Link>}>{t('meetings.loginNeeded')}</Alert>}
      </section>
    </div>
  );
}

export default function MeetingsPage() {
  const { t } = useTranslation();
  usePageTitle(t('meetings.title'));
  const { data: cfg, loading, error, reload } = useFetch(() => meetingsApi.config(), []);
  return (
    <>
      <PageHeader title={t('meetings.title')} subtitle={t('meetings.subtitle')} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <DataState loading={loading} error={error} onRetry={reload} skeletons={2} skeletonClass="h-32">
          {cfg && (cfg.enabled ? <Booker cfg={cfg} /> : <Alert tone="info">{t('meetings.closed')}</Alert>)}
        </DataState>
      </div>
    </>
  );
}
