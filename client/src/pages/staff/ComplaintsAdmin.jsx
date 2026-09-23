import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import ExportButton from '../../components/ExportButton.jsx';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { complaintsApi } from '../../api/residents.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDateTime } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';
import { COMPLAINT_CATEGORIES, COMPLAINT_TONE } from '../resident/ResidentComplaints.jsx';

const STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
const NEXT = { open: ['in_progress', 'resolved', 'closed'], assigned: ['in_progress', 'resolved', 'closed'], in_progress: ['resolved', 'closed'], resolved: ['closed', 'in_progress'], closed: [] };

function ComplaintModal({ id, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: c, loading, error, reload, } = useFetch(() => complaintsApi.get(id), [id]);
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const act = async (fn, okKey) => {
    setBusy(true);
    try { await fn(); toast.success(t(okKey)); reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={c ? `${c.code} — ${c.subject}` : t('complaints.manageTitle')} size="lg">
      <DataState loading={loading} error={error} onRetry={reload} skeletons={1} skeletonClass="h-48">
        {c && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2"><Badge tone={COMPLAINT_TONE[c.status]}>{t(`complaints.status.${c.status}`)}</Badge><Badge>{t(`complaints.categories.${c.category}`)}</Badge><Badge tone={c.priority === 'urgent' || c.priority === 'high' ? 'red' : 'slate'}>{t(`complaints.priority.${c.priority}`)}</Badge><span className="text-sm text-slate-500">{c.resident?.fullName} · {t(`public.hostelType.${c.resident?.hostelType}`)}</span></div>
            <p className="whitespace-pre-line rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{c.description}</p>
            <p className="text-sm">{t('complaints.assignedTo')}: <strong>{c.assignedTo?.name || '—'}</strong> {c.assignedTo?._id !== user.id && c.assignedTo?.id !== user.id && c.status !== 'closed' && <button className="ml-2 text-xs font-semibold text-primary-600 underline" disabled={busy} onClick={() => act(() => complaintsApi.assign(id, user.id), 'complaints.assignedToast')}>{t('complaints.assignToMe')}</button>}</p>
            {NEXT[c.status].length > 0 && <div className="flex flex-wrap gap-2">{NEXT[c.status].map((s) => <Button key={s} variant="secondary" loading={busy} onClick={() => act(() => complaintsApi.setStatus(id, s), 'complaints.statusToast')}>{t(`complaints.markAs`, { status: t(`complaints.status.${s}`) })}</Button>)}</div>}
            <ul className="space-y-2">{c.notes.map((n, i) => <li key={i} className={`rounded-lg p-3 text-sm ${n.internal ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}><span className="text-xs text-slate-500">{n.byName} · {formatDateTime(n.at, i18n.language)} {n.internal && `· ${t('complaints.internal')}`}</span><br />{n.text}</li>)}</ul>
            {c.status !== 'closed' && (
              <div className="space-y-2">
                <textarea className="field" rows={2} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('complaints.replyPlaceholder')} aria-label={t('complaints.replyPlaceholder')} />
                <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />{t('complaints.internalOnly')}</label>
                  <Button disabled={!text.trim()} loading={busy} onClick={() => act(async () => { await complaintsApi.addNote(id, { text: text.trim(), internal }); setText(''); }, 'complaints.noteToast')}>{t('complaints.addNote')}</Button></div>
              </div>
            )}
          </div>
        )}
      </DataState>
    </Modal>
  );
}

export default function ComplaintsAdmin() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const q = useDebounce(search);
  const params = { page, limit: 15, ...(status && { status }), ...(category && { category }), ...(q && { search: q }) };
  const { data, meta, loading, error, reload } = useFetch(() => complaintsApi.list(params), [JSON.stringify(params)]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('complaints.manageTitle')}</h1><ExportButton type="complaints" params={{ ...(status && { status }) }} /></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('complaints.searchPlaceholder')} aria-label={t('complaints.searchPlaceholder')} /></div>
        <select className="field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('bookings.statusLabel')}><option value="">{t('public.hostelType.all')}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(`complaints.status.${s}`)}</option>)}</select>
        <select className="field w-auto" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label={t('complaints.category')}><option value="">{t('public.hostelType.all')}</option>{COMPLAINT_CATEGORIES.map((s) => <option key={s} value={s}>{t(`complaints.categories.${s}`)}</option>)}</select>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['complaints.code', 'complaints.subject', 'resident.name', 'complaints.category', 'bookings.statusLabel', 'bookings.requestedOn', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3 font-medium">{c.subject}{(c.priority === 'urgent' || c.priority === 'high') && <Badge tone="red" className="ml-2">{t(`complaints.priority.${c.priority}`)}</Badge>}</td>
                  <td className="px-4 py-3">{c.resident?.fullName}</td>
                  <td className="px-4 py-3">{t(`complaints.categories.${c.category}`)}</td>
                  <td className="px-4 py-3"><Badge tone={COMPLAINT_TONE[c.status]}>{t(`complaints.status.${c.status}`)}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(c.createdAt, i18n.language)}</td>
                  <td className="px-4 py-3 text-right"><button className="btn-secondary py-1.5" onClick={() => setOpen(c.id)}>{t('bookings.manage')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      {open && <ComplaintModal id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}
