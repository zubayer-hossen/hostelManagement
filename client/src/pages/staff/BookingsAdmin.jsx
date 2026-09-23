import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import ExportButton from '../../components/ExportButton.jsx';
import DataState from '../../components/DataState.jsx';
import BookingStatusBadge from '../../components/BookingStatusBadge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { bookingsApi, roomsApi } from '../../api/rooms.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate, formatDateTime, formatPrice } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const STATUSES = ['pending', 'on_hold', 'approved', 'moved_in', 'moved_out', 'rejected', 'cancelled', 'expired'];

function BookingModal({ booking, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const [current, setCurrent] = useState(booking);
  const [confirm, setConfirm] = useState(null); // 'reject' | 'cancel'
  const [note, setNote] = useState('');
  const [beds, setBeds] = useState([]);
  const [bedId, setBedId] = useState('');
  const [busy, setBusy] = useState(false);

  const loadBeds = useCallback(async () => {
    if (!current.room?.id) return;
    try {
      const res = await roomsApi.adminGet(current.room.id);
      setBeds(res.data.beds.filter((b) => b.status === 'available'));
    } catch { setBeds([]); }
  }, [current.room?.id]);
  useEffect(() => { loadBeds(); }, [loadBeds, current.bed?.id]);

  const run = async (fn, successKey) => {
    setBusy(true);
    try {
      const res = await fn();
      setCurrent(res.data);
      onChanged();
      toast.success(t(successKey));
    } catch (err) {
      if (err?.response?.data?.code === 'OUTSTANDING_DUES') setConfirm('force');
      else toast.error(getErrorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  };
  const safe = (fn, key) => () => run(fn, key).catch(() => {});

  const s = current.status;
  const id = current.id;
  const open = ['pending', 'on_hold', 'approved'].includes(s);

  return (
    <>
      <Modal open onClose={onClose} title={`${current.fullName} — ${t('rooms.roomN', { n: current.room?.roomNumber })}`} size="lg">
        <div className="mb-4 flex flex-wrap items-center gap-3"><BookingStatusBadge status={s} /><span className="text-sm text-slate-500">{t('bookings.requestedOn')}: {formatDateTime(current.createdAt, i18n.language)}</span></div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">{t('common.phone')}</dt><dd className="font-medium">{current.phone}</dd></div>
          <div><dt className="text-slate-500">{t('common.email')}</dt><dd className="break-all font-medium">{current.email || current.user?.email || '—'}</dd></div>
          <div><dt className="text-slate-500">{t('bookings.gender')}</dt><dd className="font-medium">{t(`bookings.${current.gender}`)}</dd></div>
          <div><dt className="text-slate-500">{t('bookings.expectedMoveIn')}</dt><dd className="font-medium">{formatDate(current.expectedMoveIn, i18n.language)}</dd></div>
          <div><dt className="text-slate-500">{t('bookings.occupation')}</dt><dd className="font-medium">{current.occupation || '—'}</dd></div>
          <div><dt className="text-slate-500">{t('bookings.institution')}</dt><dd className="font-medium">{current.institution || '—'}</dd></div>
          <div><dt className="text-slate-500">{t('bookings.bed')}</dt><dd className="font-medium">{current.bed?.label || '—'} · {formatPrice(current.monthlyRate)}</dd></div>
          <div><dt className="text-slate-500">{t('bookings.account')}</dt><dd className="font-medium">{current.user?.name} ({t(`roles.${current.user?.role}`)})</dd></div>
        </dl>
        {current.notes && <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{current.notes}</p>}
        {current.decisionReason && <p className="mt-3 text-sm"><strong>{t('bookings.message')}:</strong> {current.decisionReason}</p>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          {(s === 'pending' || s === 'on_hold') && <Button loading={busy} onClick={safe(() => bookingsApi.approve(id), 'bookings.approvedToast')}>{t('bookings.approve')}</Button>}
          {s === 'pending' && <Button variant="secondary" loading={busy} onClick={safe(() => bookingsApi.hold(id), 'bookings.heldToast')}>{t('bookings.hold')}</Button>}
          {(s === 'pending' || s === 'on_hold') && <Button variant="danger" onClick={() => setConfirm('reject')}>{t('bookings.reject')}</Button>}
          {s === 'approved' && <Button loading={busy} onClick={safe(() => bookingsApi.checkIn(id), 'bookings.movedInToast')}>{t('bookings.checkIn')}</Button>}
          {s === 'approved' && <Button variant="danger" onClick={() => setConfirm('cancel')}>{t('bookings.cancelRequest')}</Button>}
          {s === 'moved_in' && <Button loading={busy} onClick={safe(() => bookingsApi.checkOut(id, {}), 'bookings.movedOutToast')}>{t('bookings.checkOut')}</Button>}
        </div>

        {open && (
          <div className="mt-5">
            <label className="label" htmlFor="reassign">{t('bookings.reassignBed')}</label>
            <div className="flex gap-2">
              <select id="reassign" className="field" value={bedId} onChange={(e) => setBedId(e.target.value)}>
                <option value="">{beds.length ? t('bookings.chooseBed') : t('bookings.noFreeBeds')}</option>
                {beds.map((b) => <option key={b.id} value={b.id}>{t('bookings.bed')} {b.label}</option>)}
              </select>
              <Button variant="secondary" disabled={!bedId} loading={busy} onClick={safe(() => bookingsApi.assignBed(id, bedId), 'bookings.bedAssigned')}>{t('bookings.assign')}</Button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold">{t('bookings.internalNotes')}</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {current.internalNotes?.map((n, i) => <li key={i} className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20"><span className="text-xs text-slate-500">{n.byName} · {formatDateTime(n.at, i18n.language)}</span><br />{n.text}</li>)}
            {!current.internalNotes?.length && <li className="text-slate-500">—</li>}
          </ul>
          <div className="mt-2 flex gap-2">
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={t('bookings.notePlaceholder')} aria-label={t('bookings.notePlaceholder')} />
            <Button variant="secondary" disabled={!note.trim()} loading={busy} onClick={() => run(() => bookingsApi.addNote(id, note.trim()), 'bookings.noteAdded').then(() => setNote('')).catch(() => {})}>{t('bookings.addNote')}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm === 'reject'} onClose={() => setConfirm(null)} danger withReason title={t('bookings.reject')} message={t('bookings.rejectConfirm')} confirmLabel={t('bookings.reject')}
        onConfirm={(reason) => run(() => bookingsApi.reject(id, reason), 'bookings.rejectedToast')} />
      <ConfirmDialog open={confirm === 'force'} onClose={() => setConfirm(null)} danger title={t('bookings.checkOut')} message={t('bookings.forceCheckOut')} confirmLabel={t('bookings.checkOutAnyway')}
        onConfirm={() => run(() => bookingsApi.checkOut(id, { acknowledgeOutstanding: true }), 'bookings.movedOutToast')} />
      <ConfirmDialog open={confirm === 'cancel'} onClose={() => setConfirm(null)} danger withReason title={t('bookings.cancelRequest')} message={t('bookings.cancelStaffConfirm')} confirmLabel={t('bookings.cancelRequest')}
        onConfirm={(reason) => run(() => bookingsApi.cancel(id, reason), 'bookings.cancelled')} />
    </>
  );
}

export default function BookingsAdmin() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('pending');
  const [hostelType, setHostelType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const q = useDebounce(search);

  const params = { page, limit: 15, ...(status && { status }), ...(hostelType && { hostelType }), ...(q && { search: q }) };
  const { data, meta, loading, error, reload } = useFetch(() => bookingsApi.list(params), [JSON.stringify(params)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('bookings.manageTitle')}</h1><ExportButton type="bookings" params={{ ...(status && { status }), ...(hostelType && { hostelType }) }} /></div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('bookings.searchPlaceholder')} aria-label={t('bookings.searchPlaceholder')} />
        </div>
        <select className="field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('bookings.statusLabel')}>
          <option value="">{t('public.hostelType.all')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`bookings.status.${s}`)}</option>)}
        </select>
        <select className="field w-auto" value={hostelType} onChange={(e) => { setHostelType(e.target.value); setPage(1); }} aria-label={t('rooms.hostel')}>
          <option value="">{t('public.hostelType.all')}</option>
          <option value="boys">{t('public.hostelType.boys')}</option>
          <option value="girls">{t('public.hostelType.girls')}</option>
        </select>
      </div>

      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-16">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>{['bookings.applicant', 'bookings.room', 'bookings.statusLabel', 'bookings.expectedMoveIn', 'bookings.requestedOn', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3"><p className="font-medium">{b.fullName}</p><p className="text-xs text-slate-500">{b.phone}</p></td>
                  <td className="px-4 py-3">{b.room ? `${b.room.roomNumber} · ${t(`public.hostelType.${b.hostelType}`)}` : '—'}{b.bed && <span className="text-slate-500"> ({b.bed.label})</span>}</td>
                  <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(b.expectedMoveIn, i18n.language)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(b.createdAt, i18n.language)}</td>
                  <td className="px-4 py-3 text-right"><button className="btn-secondary py-1.5" onClick={() => setSelected(b)}>{t('bookings.manage')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>

      {selected && <BookingModal key={selected.id} booking={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </div>
  );
}
