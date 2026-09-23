import { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import TicketThread from '../../components/TicketThread.jsx';
import { supportApi, TICKET_CATEGORIES, TICKET_STATUS_TONE } from '../../api/support.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDateTime } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const NEXT = { open: ['in_progress', 'waiting', 'resolved', 'closed'], in_progress: ['waiting', 'resolved', 'closed'], waiting: ['in_progress', 'resolved', 'closed'], resolved: ['closed', 'in_progress'], closed: [] };
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

function TicketModal({ id, onClose, onChanged }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: tk, loading, error, reload } = useFetch(() => supportApi.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const act = async (fn, okKey) => {
    setBusy(true);
    try { await fn(); toast.success(t(okKey)); reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const reply = async (body) => {
    try { await supportApi.reply(id, body); reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };
  return (
    <Modal open onClose={onClose} title={tk ? `${tk.code} — ${tk.subject}` : t('support.manageTitle')} size="lg">
      <DataState loading={loading} error={error} onRetry={reload} skeletons={1} skeletonClass="h-48">
        {tk && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={TICKET_STATUS_TONE[tk.status]}>{t(`support.status.${tk.status}`)}</Badge>
              <Badge>{t(`support.categories.${tk.category}`)}</Badge>
              <span className="text-slate-500">{tk.requester.name} · {tk.requester.email}{tk.requester.phone && ` · ${tk.requester.phone}`} {!tk.user && `· ${t('support.guest')}`}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">{t('complaints.priorityLabel')}
                <select className="field w-auto py-1.5" value={tk.priority} disabled={busy} onChange={(e) => act(() => supportApi.setPriority(id, e.target.value), 'complaints.statusToast')}>{PRIORITIES.map((p) => <option key={p} value={p}>{t(`complaints.priority.${p}`)}</option>)}</select></label>
              <span>{t('complaints.assignedTo')}: <strong>{tk.assignedTo?.name || '—'}</strong>
                {tk.assignedTo?.id !== user.id && tk.status !== 'closed' && <button className="ml-2 text-xs font-semibold text-primary-600 underline" disabled={busy} onClick={() => act(() => supportApi.assign(id, user.id), 'complaints.assignedToast')}>{t('complaints.assignToMe')}</button>}</span>
            </div>
            {NEXT[tk.status].length > 0 && <div className="flex flex-wrap gap-2">{NEXT[tk.status].map((s) => <Button key={s} variant="secondary" loading={busy} onClick={() => act(() => supportApi.setStatus(id, s), 'complaints.statusToast')}>{t('complaints.markAs', { status: t(`support.status.${s}`) })}</Button>)}</div>}
            <TicketThread ticket={tk} onReply={reply} allowInternal />
          </div>
        )}
      </DataState>
    </Modal>
  );
}

export default function SupportAdmin() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const q = useDebounce(search);
  const params = { page, limit: 15, ...(status && { status }), ...(category && { category }), ...(priority && { priority }), ...(q && { search: q }) };
  const { data, meta, loading, error, reload } = useFetch(() => supportApi.list(params), [JSON.stringify(params)]);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('support.manageTitle')}</h1>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('support.searchPlaceholder')} aria-label={t('support.searchPlaceholder')} /></div>
        <select className="field w-auto" value={status} onChange={reset(setStatus)} aria-label={t('bookings.statusLabel')}><option value="">{t('public.hostelType.all')}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(`support.status.${s}`)}</option>)}</select>
        <select className="field w-auto" value={category} onChange={reset(setCategory)} aria-label={t('complaints.category')}><option value="">{t('public.hostelType.all')}</option>{TICKET_CATEGORIES.map((s) => <option key={s} value={s}>{t(`support.categories.${s}`)}</option>)}</select>
        <select className="field w-auto" value={priority} onChange={reset(setPriority)} aria-label={t('complaints.priorityLabel')}><option value="">{t('public.hostelType.all')}</option>{PRIORITIES.map((s) => <option key={s} value={s}>{t(`complaints.priority.${s}`)}</option>)}</select>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['complaints.code', 'complaints.subject', 'support.from', 'complaints.category', 'bookings.statusLabel', 'support.lastActivity', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((tk) => (
                <tr key={tk.id}>
                  <td className="px-4 py-3 font-mono text-xs">{tk.code}</td>
                  <td className="px-4 py-3 font-medium">{tk.subject}{['high', 'urgent'].includes(tk.priority) && <Badge tone="red" className="ml-2">{t(`complaints.priority.${tk.priority}`)}</Badge>}</td>
                  <td className="px-4 py-3">{tk.requester.name}{!tk.user && <span className="ml-1 text-xs text-slate-400">({t('support.guest')})</span>}</td>
                  <td className="px-4 py-3">{t(`support.categories.${tk.category}`)}</td>
                  <td className="px-4 py-3"><Badge tone={TICKET_STATUS_TONE[tk.status]}>{t(`support.status.${tk.status}`)}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateTime(tk.lastActivityAt, i18n.language)}</td>
                  <td className="px-4 py-3 text-right"><button className="btn-secondary py-1.5" onClick={() => setOpen(tk.id)}>{t('bookings.manage')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      {open && <TicketModal id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}
