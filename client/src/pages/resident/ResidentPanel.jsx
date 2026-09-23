import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { BedDouble, Wallet, AlertTriangle, FileText } from 'lucide-react';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import DataState from '../../components/DataState.jsx';
import NoticeCard from '../../components/NoticeCard.jsx';
import EventCard from '../../components/EventCard.jsx';
import { contentApi } from '../../api/content.js';
import { residentApi, warningsApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDate, formatPrice } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const STATUS_TONE = { pending: 'amber', verified: 'green', rejected: 'red', suspended: 'red', archived: 'slate' };

function MoveOut({ resident, onDone }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const mo = resident.moveOut || {};

  if (!resident.room) return null;
  if (mo.status === 'requested') return <Alert tone="info" title={t('resident.moveOut.requested')}>{t('resident.moveOut.requestedText', { date: formatDate(mo.requestedDate, i18n.language) })}</Alert>;
  if (mo.status === 'approved') return <Alert tone="success" title={t('resident.moveOut.approved')}>{mo.decisionNote || t('resident.moveOut.approvedText')}</Alert>;

  const submit = async () => {
    setBusy(true);
    try {
      await residentApi.requestMoveOut({ date, ...(reason && { reason }) });
      toast.success(t('resident.moveOut.sent'));
      setOpen(false);
      onDone();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <>
      {mo.status === 'rejected' && <Alert tone="error" title={t('resident.moveOut.rejected')}>{mo.decisionNote}</Alert>}
      <div className="text-right"><button className="btn-secondary" onClick={() => setOpen(true)}>{t('resident.moveOut.request')}</button></div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('resident.moveOut.request')} size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('resident.moveOut.explain')}</p>
        <label className="label mt-4" htmlFor="mo-date">{t('resident.moveOut.date')}</label>
        <input id="mo-date" type="date" className="field" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="label mt-4" htmlFor="mo-reason">{t('common.reason')} ({t('common.optional')})</label>
        <textarea id="mo-reason" rows={3} maxLength={500} className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button disabled={!date} loading={busy} onClick={submit}>{t('resident.moveOut.send')}</Button></div>
      </Modal>
    </>
  );
}

/** Resident section of the dashboard: room, rent, dues, warnings, rules and notices. */
export default function ResidentPanel() {
  const { t, i18n } = useTranslation();
  const me = useFetch(() => residentApi.me(), []);
  const warnings = useFetch(() => warningsApi.mine(), []);
  const notices = useFetch(() => residentApi.notices(), []);
  const events = useFetch(() => contentApi.events({ when: 'upcoming', limit: 3 }), []);
  const [ackBusy, setAckBusy] = useState(false);

  const acknowledge = async () => {
    setAckBusy(true);
    try { await residentApi.acknowledgeRules(); toast.success(t('resident.rulesThanks')); me.reload(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setAckBusy(false); }
  };

  return (
    <DataState loading={me.loading} error={me.error} empty={me.notFound} onRetry={me.reload} skeletons={2} skeletonClass="h-32">
      {me.data && (() => {
        const { resident, outstanding, missingFields } = me.data;
        const activeWarnings = (warnings.data || []).filter((w) => w.status === 'active').length;
        return (
          <div className="space-y-6">
            {missingFields.length > 0 && (
              <Alert tone="info" title={t('resident.completeTitle')} action={<Link to="/dashboard/resident/profile" className="shrink-0 text-sm font-semibold underline">{t('resident.completeCta')}</Link>}>{t('resident.completeText')}</Alert>
            )}
            {!resident.rulesAcknowledgedAt && resident.room && (
              <Alert tone="info" title={t('resident.rulesTitle')} action={<button disabled={ackBusy} onClick={acknowledge} className="shrink-0 text-sm font-semibold underline">{t('resident.rulesAccept')}</button>}>
                {t('resident.rulesText')} <Link to="/rules" className="font-semibold underline">{t('public.footer.rules')}</Link>
              </Alert>
            )}
            {activeWarnings > 0 && <Alert tone="error" title={t('warnings.activeTitle', { count: activeWarnings })} action={<Link to="/dashboard/resident/warnings" className="shrink-0 text-sm font-semibold underline">{t('warnings.view')}</Link>} />}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card"><BedDouble className="text-primary-600" /><p className="mt-2 text-xs text-slate-500">{t('resident.yourRoom')}</p><p className="text-xl font-bold">{resident.room ? `${resident.room.roomNumber} · ${t('bookings.bed')} ${resident.bed?.label ?? '—'}` : '—'}</p></div>
              <div className="card"><Wallet className="text-primary-600" /><p className="mt-2 text-xs text-slate-500">{t('resident.monthlyRent')}</p><p className="text-xl font-bold">{formatPrice(resident.monthlyRent)}</p></div>
              <div className="card"><FileText className={outstanding > 0 ? 'text-red-600' : 'text-emerald-600'} /><p className="mt-2 text-xs text-slate-500">{t('finance.outstanding')}</p><p className={`text-xl font-bold ${outstanding > 0 ? 'text-red-600' : ''}`}>{formatPrice(outstanding)}</p></div>
              <div className="card"><AlertTriangle className="text-primary-600" /><p className="mt-2 text-xs text-slate-500">{t('resident.profileStatus')}</p><p className="mt-1"><Badge tone={STATUS_TONE[resident.status]}>{t(`resident.status.${resident.status}`)}</Badge></p></div>
            </div>
            {resident.joiningDate && <p className="text-sm text-slate-500">{t('resident.joined')}: {formatDate(resident.joiningDate, i18n.language)}</p>}

            <MoveOut resident={resident} onDone={me.reload} />

            {events.data?.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{t('resident.eventsTitle')}</h2>
                <div className="grid gap-4 md:grid-cols-3">{events.data.map((e) => <EventCard key={e.id} event={e} />)}</div>
              </section>
            )}

            {notices.data?.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">{t('resident.noticesTitle')}</h2>
                <div className="grid gap-4 md:grid-cols-2">{notices.data.slice(0, 4).map((n) => <NoticeCard key={n.id} notice={n} />)}</div>
              </section>
            )}
          </div>
        );
      })()}
    </DataState>
  );
}
