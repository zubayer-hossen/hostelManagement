import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import ExportButton from '../../components/ExportButton.jsx';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ResidentPicker from '../../components/ResidentPicker.jsx';
import { financeApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate, formatPrice } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';
import { DUE_TONE } from '../resident/ResidentPayments.jsx';

const METHODS = ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other'];
const DUE_STATUSES = ['due', 'partially_paid', 'overdue', 'paid', 'void'];
const now = new Date();

function RecordPayment({ due, onClose, onDone }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(String(due.balance));
  const [method, setMethod] = useState('cash');
  const [txn, setTxn] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await financeApi.record({ dueId: due.id, amount: Number(amount), method, ...(txn && { transactionId: txn }), ...(note && { note }) });
      toast.success(t('finance.paymentRecorded')); onDone(); onClose();
    } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`${t('finance.recordPayment')} — ${due.resident?.fullName}`} size="sm">
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-sm text-slate-500">{due.description || t(`finance.types.${due.type}`)} · {t('finance.balance')}: <strong>{formatPrice(due.balance)}</strong></p>
        <label className="block"><span className="label">{t('finance.amount')}</span><input type="number" min="0.01" max={due.balance} step="0.01" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label className="block"><span className="label">{t('finance.method')}</span><select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{t(`finance.methods.${m}`)}</option>)}</select></label>
        <label className="block"><span className="label">{t('finance.transactionId')} ({t('common.optional')})</span><input className="field" maxLength={80} value={txn} onChange={(e) => setTxn(e.target.value)} /></label>
        <label className="block"><span className="label">{t('bookings.notes')} ({t('common.optional')})</span><input className="field" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} disabled={!(Number(amount) > 0)} onClick={submit}>{t('finance.recordPayment')}</Button></div>
      </div>
    </Modal>
  );
}

function GenerateRent({ onClose, onDone }) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dueDay, setDueDay] = useState(10);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { const r = await financeApi.generate({ month: Number(month), year: Number(year), dueDay: Number(dueDay) }); toast.success(t('finance.generated', r.data)); onDone(); onClose(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={t('finance.generateRent')} size="sm">
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{t('finance.generateExplain')}</p>
      <div className="grid grid-cols-3 gap-3">
        <label className="block"><span className="label">{t('finance.month')}</span><input type="number" min="1" max="12" className="field" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <label className="block"><span className="label">{t('finance.year')}</span><input type="number" min="2000" max="2100" className="field" value={year} onChange={(e) => setYear(e.target.value)} /></label>
        <label className="block"><span className="label">{t('finance.dueDay')}</span><input type="number" min="1" max="28" className="field" value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={run}>{t('finance.generate')}</Button></div>
    </Modal>
  );
}

function AddCharge({ onClose, onDone }) {
  const { t } = useTranslation();
  const [resident, setResident] = useState(null);
  const [type, setType] = useState('late_fee');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true); setError(null);
    const d = new Date(dueDate);
    try {
      await financeApi.createDue({ residentId: resident.id, type, month: d.getMonth() + 1, year: d.getFullYear(), amount: Number(amount), description, dueDate: dueDate });
      toast.success(t('finance.chargeAdded')); onDone(); onClose();
    } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={t('finance.addCharge')} size="sm">
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <ResidentPicker selected={resident} onSelect={setResident} />
        <label className="block"><span className="label">{t('finance.type')}</span><select className="field" value={type} onChange={(e) => setType(e.target.value)}>{['late_fee', 'adjustment', 'other', 'rent'].map((x) => <option key={x} value={x}>{t(`finance.types.${x}`)}</option>)}</select></label>
        <label className="block"><span className="label">{t('finance.amount')}</span><input type="number" min="1" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label className="block"><span className="label">{t('finance.description')}</span><input className="field" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <label className="block"><span className="label">{t('finance.dueDate')}</span><input type="date" className="field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} disabled={!resident || !(Number(amount) > 0)} onClick={submit}>{t('finance.addCharge')}</Button></div>
      </div>
    </Modal>
  );
}

function DuesTab({ onChanged }) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pay, setPay] = useState(null);
  const [toVoid, setToVoid] = useState(null);
  const q = useDebounce(search);
  const params = { page, limit: 15, ...(status && { status }), ...(q && { search: q }) };
  const { data, meta, loading, error, reload } = useFetch(() => financeApi.dues(params), [JSON.stringify(params)]);
  const refresh = () => { reload(); onChanged(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('finance.searchResident')} aria-label={t('finance.searchResident')} /></div>
        <select className="field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('bookings.statusLabel')}><option value="">{t('public.hostelType.all')}</option>{DUE_STATUSES.map((s) => <option key={s} value={s}>{t(`finance.status.${s}`)}</option>)}</select>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['finance.resident', 'finance.period', 'finance.description', 'finance.amount', 'finance.balance', 'finance.dueDate', 'bookings.statusLabel', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((d) => (
                <tr key={d.id} className={d.isVoid ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-medium">{d.resident?.fullName}</td>
                  <td className="px-4 py-3">{d.month}/{d.year}</td>
                  <td className="px-4 py-3">{d.description || t(`finance.types.${d.type}`)}</td>
                  <td className="px-4 py-3">{formatPrice(d.amount)}</td>
                  <td className="px-4 py-3">{formatPrice(d.balance)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(d.dueDate, i18n.language)}</td>
                  <td className="px-4 py-3"><Badge tone={DUE_TONE[d.status]}>{t(`finance.status.${d.status}`)}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {!d.isVoid && d.balance > 0 && <button className="btn-secondary py-1.5" onClick={() => setPay(d)}>{t('finance.pay')}</button>}
                    {!d.isVoid && d.paidAmount === 0 && <button className="btn-ghost py-1.5 text-red-600" onClick={() => setToVoid(d)}>{t('finance.void')}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      {pay && <RecordPayment due={pay} onClose={() => setPay(null)} onDone={refresh} />}
      <ConfirmDialog open={Boolean(toVoid)} onClose={() => setToVoid(null)} danger withReason title={t('finance.void')} message={t('finance.voidDueConfirm')} confirmLabel={t('finance.void')}
        onConfirm={async (reason) => { try { await financeApi.voidDue(toVoid.id, reason || t('finance.voidedByStaff')); toast.success(t('finance.voidedToast')); refresh(); } catch (err) { toast.error(getErrorMessage(err)); throw err; } }} />
    </div>
  );
}

function PaymentsTab({ onChanged }) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [toVoid, setToVoid] = useState(null);
  const { data, meta, loading, error, reload } = useFetch(() => financeApi.payments({ page, limit: 15 }), [page]);
  return (
    <>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['finance.receipt', 'finance.resident', 'finance.date', 'finance.amount', 'finance.method', 'finance.recordedBy', 'bookings.statusLabel', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((p) => (
                <tr key={p.id} className={p.status === 'voided' ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-mono text-xs">{p.receiptNo}</td>
                  <td className="px-4 py-3 font-medium">{p.resident?.fullName}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(p.paidAt, i18n.language)}</td>
                  <td className="px-4 py-3">{formatPrice(p.amount)}</td>
                  <td className="px-4 py-3">{t(`finance.methods.${p.method}`)}</td>
                  <td className="px-4 py-3">{p.recordedBy?.name || '—'}</td>
                  <td className="px-4 py-3">{p.status === 'voided' ? <Badge tone="red">{t('finance.voided')}</Badge> : <Badge tone="green">{t('finance.recorded')}</Badge>}</td>
                  <td className="px-4 py-3 text-right">{p.status === 'recorded' && <button className="btn-ghost py-1.5 text-red-600" onClick={() => setToVoid(p)}>{t('finance.void')}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      <ConfirmDialog open={Boolean(toVoid)} onClose={() => setToVoid(null)} danger withReason title={t('finance.void')} message={t('finance.voidPaymentConfirm')} confirmLabel={t('finance.void')}
        onConfirm={async (reason) => { try { await financeApi.voidPayment(toVoid.id, reason || t('finance.voidedByStaff')); toast.success(t('finance.voidedToast')); reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); throw err; } }} />
    </>
  );
}

export default function FinanceAdmin() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('dues');
  const [modal, setModal] = useState(null);
  const [version, setVersion] = useState(0);
  const summary = useFetch(() => financeApi.summary(), [version]);
  const bump = () => setVersion((v) => v + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('finance.manageTitle')}</h1>
        <div className="flex flex-wrap gap-2"><ExportButton type={tab} /><Button variant="secondary" onClick={() => setModal('gen')}>{t('finance.generateRent')}</Button><Button onClick={() => setModal('add')}><Plus size={16} />{t('finance.addCharge')}</Button></div>
      </div>

      {summary.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card"><p className="text-xs text-slate-500">{t('finance.totalOutstanding')}</p><p className="text-2xl font-extrabold text-red-600">{formatPrice(summary.data.totalOutstanding)}</p></div>
          <div className="card"><p className="text-xs text-slate-500">{t('finance.collectedThisMonth')}</p><p className="text-2xl font-extrabold text-emerald-600">{formatPrice(summary.data.collectedThisMonth)}</p></div>
          <div className="card"><p className="text-xs text-slate-500">{t('finance.overdueCount')}</p><p className="text-2xl font-extrabold">{summary.data.overdueCount}</p></div>
        </div>
      )}

      <div role="tablist" className="flex gap-2">
        {['dues', 'payments'].map((k) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{t(`finance.tabs.${k}`)}</button>)}
      </div>

      {tab === 'dues' ? <DuesTab key={`d${version}`} onChanged={bump} /> : <PaymentsTab key={`p${version}`} onChanged={bump} />}
      {modal === 'gen' && <GenerateRent onClose={() => setModal(null)} onDone={bump} />}
      {modal === 'add' && <AddCharge onClose={() => setModal(null)} onDone={bump} />}
    </div>
  );
}
