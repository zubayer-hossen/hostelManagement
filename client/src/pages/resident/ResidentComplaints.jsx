import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { complaintsApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

export const COMPLAINT_CATEGORIES = ['food', 'room', 'maintenance', 'electricity', 'water', 'internet', 'security', 'staff', 'noise', 'other'];
export const COMPLAINT_TONE = { open: 'amber', assigned: 'primary', in_progress: 'primary', resolved: 'green', closed: 'slate' };

function NewComplaint({ onClose, onCreated }) {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { category: 'maintenance', priority: 'normal', subject: '', description: '' } });
  const onSubmit = async (v) => {
    setError(null);
    try { await complaintsApi.create(v); toast.success(t('complaints.submitted')); onCreated(); onClose(); } catch (err) {
      setError(getFieldErrors(err).map((e) => e.message).join(' · ') || getErrorMessage(err));
    }
  };
  return (
    <Modal open onClose={onClose} title={t('complaints.new')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">{t('complaints.category')}</span><select className="field" {...register('category')}>{COMPLAINT_CATEGORIES.map((c) => <option key={c} value={c}>{t(`complaints.categories.${c}`)}</option>)}</select></label>
          <label className="block"><span className="label">{t('complaints.priorityLabel')}</span><select className="field" {...register('priority')}>{['low', 'normal', 'high', 'urgent'].map((p) => <option key={p} value={p}>{t(`complaints.priority.${p}`)}</option>)}</select></label>
        </div>
        <label className="block"><span className="label">{t('complaints.subject')}</span><input className="field" required minLength={3} maxLength={140} {...register('subject')} /></label>
        <label className="block"><span className="label">{t('complaints.description')}</span><textarea rows={5} required minLength={10} maxLength={3000} className="field" {...register('description')} /></label>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" loading={isSubmitting}>{t('complaints.submit')}</Button></div>
      </form>
    </Modal>
  );
}

function Detail({ id, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => complaintsApi.get(id), [id]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try { await complaintsApi.reply(id, text.trim()); setText(''); reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={data ? `${data.code} — ${data.subject}` : t('complaints.myTitle')} size="lg">
      <DataState loading={loading} error={error} onRetry={reload} skeletons={1} skeletonClass="h-40">
        {data && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2"><Badge tone={COMPLAINT_TONE[data.status]}>{t(`complaints.status.${data.status}`)}</Badge><Badge>{t(`complaints.categories.${data.category}`)}</Badge>{data.assignedTo && <Badge tone="primary">{data.assignedTo.name}</Badge>}</div>
            <p className="whitespace-pre-line text-sm">{data.description}</p>
            <ul className="space-y-2">
              {data.notes.map((n, i) => <li key={i} className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800"><span className="text-xs text-slate-500">{n.byName} · {formatDateTime(n.at, i18n.language)}</span><br />{n.text}</li>)}
            </ul>
            {data.status !== 'closed' && (
              <div className="flex gap-2"><input className="field" value={text} maxLength={1500} onChange={(e) => setText(e.target.value)} placeholder={t('complaints.replyPlaceholder')} aria-label={t('complaints.replyPlaceholder')} /><Button disabled={!text.trim()} loading={busy} onClick={send}>{t('complaints.reply')}</Button></div>
            )}
          </div>
        )}
      </DataState>
    </Modal>
  );
}

export default function ResidentComplaints() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => complaintsApi.mine(), []);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('complaints.myTitle')}</h1><Button onClick={() => setCreating(true)}><Plus size={16} />{t('complaints.new')}</Button></div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={2} skeletonClass="h-20">
        <ul className="space-y-3">
          {data?.map((c) => (
            <li key={c.id}><button onClick={() => setOpen(c.id)} className="card flex w-full flex-wrap items-center justify-between gap-3 text-left transition hover:shadow-glow">
              <div><p className="font-semibold">{c.subject}</p><p className="text-xs text-slate-500">{c.code} · {t(`complaints.categories.${c.category}`)} · {formatDateTime(c.createdAt, i18n.language)}</p></div>
              <Badge tone={COMPLAINT_TONE[c.status]}>{t(`complaints.status.${c.status}`)}</Badge>
            </button></li>
          ))}
        </ul>
      </DataState>
      {creating && <NewComplaint onClose={() => setCreating(false)} onCreated={reload} />}
      {open && <Detail id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}
