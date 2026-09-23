import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import ExportButton from '../../components/ExportButton.jsx';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { residentApi, warningsApi } from '../../api/residents.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { openBlob } from '../../utils/download.js';
import { roomsApi } from '../../api/rooms.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate, formatPrice } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const STATUSES = ['pending', 'verified', 'rejected', 'suspended', 'archived'];
const TONE = { pending: 'amber', verified: 'green', rejected: 'red', suspended: 'red', archived: 'slate' };
const NEXT = { pending: ['verified', 'rejected'], verified: ['suspended', 'archived'], rejected: ['pending'], suspended: ['verified', 'archived'], archived: [] };
const WARN_TYPES = ['rent_overdue', 'repeated_complaints', 'rule_violation', 'disciplinary', 'other'];

function Row({ label, children }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="text-sm font-medium">{children || '—'}</dd></div>;
}

function TransferForm({ resident, onDone }) {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [beds, setBeds] = useState([]);
  const [bedId, setBedId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    roomsApi.adminList({ hostelType: resident.hostelType, availability: 'available', limit: 50 }).then((r) => setRooms(r.data)).catch(() => {});
  }, [resident.hostelType]);
  useEffect(() => {
    setBedId(''); setBeds([]);
    if (roomId) roomsApi.adminGet(roomId).then((r) => setBeds(r.data.beds.filter((b) => b.status === 'available'))).catch(() => {});
  }, [roomId]);

  const submit = async () => {
    setBusy(true);
    try { await residentApi.transfer(resident.id, { bedId, reason }); toast.success(t('resident.transferred')); onDone(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="field" value={roomId} onChange={(e) => setRoomId(e.target.value)} aria-label={t('bookings.room')}><option value="">{t('resident.chooseRoom')}</option>{rooms.map((r) => <option key={r.id} value={r.id}>{t('rooms.roomN', { n: r.roomNumber })} · {formatPrice(r.price)} · {r.availableBeds} {t('rooms.availableBeds').toLowerCase()}</option>)}</select>
        <select className="field" value={bedId} onChange={(e) => setBedId(e.target.value)} disabled={!beds.length} aria-label={t('bookings.bed')}><option value="">{t('bookings.chooseBed')}</option>{beds.map((b) => <option key={b.id} value={b.id}>{t('bookings.bed')} {b.label}</option>)}</select>
      </div>
      <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder={t('resident.transferReason')} aria-label={t('resident.transferReason')} />
      <p className="text-xs text-slate-500">{t('resident.transferNote')}</p>
      <Button loading={busy} disabled={!bedId || reason.trim().length < 3} onClick={submit}>{t('resident.transfer')}</Button>
    </div>
  );
}

function Warnings({ resident }) {
  const { t, i18n } = useTranslation();
  const list = useFetch(() => warningsApi.list({ residentId: resident.id, limit: 20 }), [resident.id]);
  const [form, setForm] = useState({ type: 'rule_violation', severity: 'low', reason: '', description: '' });
  const [busy, setBusy] = useState(false);

  const issue = async () => {
    setBusy(true);
    try { await warningsApi.issue({ residentId: resident.id, ...form }); toast.success(t('warnings.issued')); setForm({ ...form, reason: '', description: '' }); list.reload(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const close = async (id, status) => {
    try { await warningsApi.close(id, { status }); toast.success(t('warnings.closed')); list.reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {list.data?.map((w) => (
          <li key={w.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2"><Badge tone={w.severity === 'high' ? 'red' : w.severity === 'medium' ? 'amber' : 'slate'}>{t(`warnings.severity.${w.severity}`)}</Badge><Badge>{t(`warnings.types.${w.type}`)}</Badge><Badge tone={w.status === 'active' ? 'red' : 'green'}>{t(`warnings.status.${w.status}`)}</Badge><span className="text-xs text-slate-500">{formatDate(w.createdAt, i18n.language)} · {w.issuedBy?.name}</span></div>
            <p className="mt-1 font-medium">{w.reason}</p>
            {['active', 'acknowledged'].includes(w.status) && <div className="mt-2 flex gap-2"><button className="btn-secondary py-1" onClick={() => close(w.id, 'resolved')}>{t('warnings.resolve')}</button><button className="btn-ghost py-1" onClick={() => close(w.id, 'withdrawn')}>{t('warnings.withdraw')}</button></div>}
          </li>
        ))}
        {!list.data?.length && <li className="text-sm text-slate-500">{t('warnings.none')}</li>}
      </ul>
      <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
        <p className="text-sm font-semibold">{t('warnings.issue')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label={t('warnings.typeLabel')}>{WARN_TYPES.map((x) => <option key={x} value={x}>{t(`warnings.types.${x}`)}</option>)}</select>
          <select className="field" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} aria-label={t('warnings.severityLabel')}>{['low', 'medium', 'high'].map((x) => <option key={x} value={x}>{t(`warnings.severity.${x}`)}</option>)}</select>
        </div>
        <input className="field" maxLength={140} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t('warnings.reason')} aria-label={t('warnings.reason')} />
        <textarea className="field" rows={2} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('warnings.details')} aria-label={t('warnings.details')} />
        <p className="text-xs text-slate-500">{t('warnings.manualNote')}</p>
        <Button loading={busy} disabled={form.reason.trim().length < 3} onClick={issue}>{t('warnings.issueBtn')}</Button>
      </div>
    </div>
  );
}

const DOC_TONE = { pending: 'amber', verified: 'green', rejected: 'red' };

function Documents({ resident }) {
  const { t, i18n } = useTranslation();
  const list = useFetch(() => residentApi.documents(resident.id), [resident.id]);
  const view = async (docId) => { try { openBlob(await residentApi.documentBlob(resident.id, docId)); } catch (err) { toast.error(getErrorMessage(err)); } };
  const review = async (docId, status) => {
    try { await residentApi.reviewDocument(resident.id, docId, { status }); toast.success(t('documents.reviewed')); list.reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{t('documents.staffNote')}</p>
      <DataState loading={list.loading} error={list.error} empty={!list.data?.length} onRetry={list.reload} skeletons={1} skeletonClass="h-12">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.data?.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1"><p className="font-medium">{t(`documents.types.${d.type}`)}{d.label && ` — ${d.label}`}</p><p className="text-xs text-slate-500">{formatDate(d.createdAt, i18n.language)}</p></div>
              <Badge tone={DOC_TONE[d.status]}>{t(`documents.status.${d.status}`)}</Badge>
              <button className="btn-secondary py-1" onClick={() => view(d.id)}>{t('documents.view')}</button>
              {d.status !== 'verified' && <button className="btn-secondary py-1" onClick={() => review(d.id, 'verified')}>{t('resident.setStatus.verified')}</button>}
              {d.status !== 'rejected' && <button className="btn-ghost py-1 text-red-600" onClick={() => review(d.id, 'rejected')}>{t('resident.setStatus.rejected')}</button>}
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  );
}

function ResidentModal({ id, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { data: r, loading, error, reload } = useFetch(() => residentApi.get(id), [id]);
  const [tab, setTab] = useState('profile');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = () => { reload(); onChanged(); };

  const act = async (fn, okKey) => {
    setBusy(true);
    try { await fn(); toast.success(t(okKey)); refresh(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={r?.fullName || t('resident.manageTitle')} size="lg">
      <DataState loading={loading} error={error} onRetry={reload} skeletons={1} skeletonClass="h-48">
        {r && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2"><Badge tone={TONE[r.status]}>{t(`resident.status.${r.status}`)}</Badge>{r.outstanding > 0 && <Badge tone="red">{t('finance.outstanding')}: {formatPrice(r.outstanding)}</Badge>}{r.moveOut?.status === 'requested' && <Badge tone="amber">{t('resident.moveOut.requested')}</Badge>}</div>
            <div role="tablist" className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
              {['profile', 'stay', 'warnings', ...(hasPermission('manageResidentDocuments') ? ['documents'] : [])].map((k) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === k ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'}`}>{t(`resident.tabs.${k}`)}</button>)}
            </div>

            {tab === 'profile' && (
              <>
                {r.missingFields.length > 0 && <Alert tone="info" title={t('resident.stillNeeded')}>{r.missingFields.map((k) => t(`resident.fields.${k}`)).join(', ')}</Alert>}
                <dl className="grid gap-3 sm:grid-cols-3">
                  <Row label={t('common.phone')}>{r.phone}</Row><Row label={t('common.email')}>{r.email}</Row><Row label={t('resident.fields.dateOfBirth')}>{r.dateOfBirth && formatDate(r.dateOfBirth, i18n.language)}</Row>
                  <Row label={t('resident.fields.fatherName')}>{r.fatherName}</Row><Row label={t('resident.fields.motherName')}>{r.motherName}</Row><Row label={t('resident.fields.bloodGroup')}>{r.bloodGroup}</Row>
                  <Row label={t('resident.fields.emergencyContact')}>{r.emergencyContact?.name && `${r.emergencyContact.name} · ${r.emergencyContact.phone} (${r.emergencyContact.relation || '—'})`}</Row>
                  <Row label={t('resident.fields.guardian')}>{r.guardian?.name && `${r.guardian.name} · ${r.guardian.phone}`}</Row><Row label={t('resident.fields.nationality')}>{r.nationality}</Row>
                  <Row label={t('resident.fields.permanentAddress')}>{r.permanentAddress}</Row><Row label={t('resident.fields.presentAddress')}>{r.presentAddress}</Row><Row label={t('resident.fields.institution')}>{[r.institution, r.department].filter(Boolean).join(' — ')}</Row>
                </dl>
                {NEXT[r.status].length > 0 && (
                  <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <input className="field" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('resident.verifyNote')} aria-label={t('resident.verifyNote')} />
                    <div className="flex flex-wrap gap-2">{NEXT[r.status].map((s) => <Button key={s} variant={['rejected', 'suspended', 'archived'].includes(s) ? 'danger' : 'primary'} loading={busy} onClick={() => act(() => residentApi.verify(r.id, { status: s, ...(note && { note }) }), 'resident.updated')}>{t(`resident.setStatus.${s}`)}</Button>)}</div>
                  </div>
                )}
              </>
            )}

            {tab === 'stay' && (
              <>
                <dl className="grid gap-3 sm:grid-cols-3"><Row label={t('bookings.room')}>{r.room && `${r.room.roomNumber} · ${t('bookings.bed')} ${r.bed?.label ?? '—'}`}</Row><Row label={t('resident.monthlyRent')}>{formatPrice(r.monthlyRent)}</Row><Row label={t('resident.joined')}>{r.joiningDate && formatDate(r.joiningDate, i18n.language)}</Row></dl>
                {r.moveOut?.status === 'requested' && (
                  <Alert tone="info" title={t('resident.moveOut.requested')}>
                    {t('resident.moveOut.requestedText', { date: formatDate(r.moveOut.requestedDate, i18n.language) })} {r.moveOut.reason}
                    <div className="mt-3 flex flex-wrap gap-2"><Button loading={busy} onClick={() => act(() => residentApi.decideMoveOut(r.id, { approve: true, note }), 'resident.updated')}>{t('resident.moveOut.approve')}</Button><Button variant="danger" loading={busy} onClick={() => act(() => residentApi.decideMoveOut(r.id, { approve: false, note }), 'resident.updated')}>{t('resident.moveOut.decline')}</Button></div>
                    <p className="mt-2 text-xs">{t('resident.moveOut.finalDue', { amount: formatPrice(r.outstanding) })} {t('resident.moveOut.checkOutHint')}</p>
                  </Alert>
                )}
                {r.room && r.status !== 'archived' && <div className="border-t border-slate-200 pt-4 dark:border-slate-800"><p className="mb-2 text-sm font-semibold">{t('resident.transferTitle')}</p><TransferForm resident={r} onDone={refresh} /></div>}
              </>
            )}

            {tab === 'warnings' && <Warnings resident={r} />}
            {tab === 'documents' && <Documents resident={r} />}
          </div>
        )}
      </DataState>
    </Modal>
  );
}

export default function ResidentsAdmin() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [hostelType, setHostelType] = useState('');
  const [hasDue, setHasDue] = useState(false);
  const [moveOut, setMoveOut] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const q = useDebounce(search);
  const params = { page, limit: 15, ...(status && { status }), ...(hostelType && { hostelType }), ...(hasDue && { hasDue: 'true' }), ...(moveOut && { moveOut }), ...(q && { search: q }) };
  const { data, meta, loading, error, reload } = useFetch(() => residentApi.list(params), [JSON.stringify(params)]);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('resident.manageTitle')}</h1><ExportButton type="residents" params={{ ...(status && { status }), ...(hostelType && { hostelType }) }} /></div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('bookings.searchPlaceholder')} aria-label={t('bookings.searchPlaceholder')} /></div>
        <select className="field w-auto" value={status} onChange={reset(setStatus)} aria-label={t('bookings.statusLabel')}><option value="">{t('public.hostelType.all')}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(`resident.status.${s}`)}</option>)}</select>
        <select className="field w-auto" value={hostelType} onChange={reset(setHostelType)} aria-label={t('rooms.hostel')}><option value="">{t('public.hostelType.all')}</option><option value="boys">{t('public.hostelType.boys')}</option><option value="girls">{t('public.hostelType.girls')}</option></select>
        <select className="field w-auto" value={moveOut} onChange={reset(setMoveOut)} aria-label={t('resident.moveOut.filter')}><option value="">{t('resident.moveOut.filter')}</option><option value="requested">{t('resident.moveOut.requested')}</option></select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hasDue} onChange={(e) => { setHasDue(e.target.checked); setPage(1); }} />{t('resident.onlyWithDues')}</label>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['resident.name', 'bookings.room', 'bookings.statusLabel', 'finance.outstanding', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3"><p className="font-medium">{r.fullName}</p><p className="text-xs text-slate-500">{r.phone} · {t(`public.hostelType.${r.hostelType}`)}</p></td>
                  <td className="px-4 py-3">{r.room ? `${r.room.roomNumber} (${r.bed?.label ?? '—'})` : '—'}</td>
                  <td className="px-4 py-3"><Badge tone={TONE[r.status]}>{t(`resident.status.${r.status}`)}</Badge>{r.moveOut?.status === 'requested' && <Badge tone="amber" className="ml-1">{t('resident.moveOut.short')}</Badge>}</td>
                  <td className={`px-4 py-3 ${r.outstanding > 0 ? 'font-semibold text-red-600' : ''}`}>{formatPrice(r.outstanding)}</td>
                  <td className="px-4 py-3 text-right"><button className="btn-secondary py-1.5" onClick={() => setOpen(r.id)}>{t('bookings.manage')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      {open && <ResidentModal id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}
