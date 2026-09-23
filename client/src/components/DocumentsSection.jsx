import { useRef, useState } from 'react';
import { Eye, FileText, Trash2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Badge from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import DataState from './DataState.jsx';
import { residentApi } from '../api/residents.js';
import { useFetch } from '../hooks/useFetch.js';
import { openBlob } from '../utils/download.js';
import { formatDate } from '../utils/format.js';
import { getErrorMessage } from '../utils/errors.js';

const TYPES = ['national_id', 'student_id', 'passport', 'guardian_letter', 'other'];
const TONE = { pending: 'amber', verified: 'green', rejected: 'red' };
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

/** The signed-in resident's private documents. Files are only ever fetched through the authenticated API. */
export default function DocumentsSection() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => residentApi.myDocuments(), []);
  const [type, setType] = useState('student_id');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const input = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error(t('documents.tooLarge')); return; }
    setBusy(true);
    try { await residentApi.uploadDocument(file, { type, label: label.trim() }); toast.success(t('documents.uploaded')); setLabel(''); reload(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const view = async (id) => { try { openBlob(await residentApi.myDocumentBlob(id)); } catch (err) { toast.error(getErrorMessage(err)); } };
  const remove = async () => {
    try { await residentApi.deleteDocument(toDelete.id); toast.success(t('cms.deleted')); reload(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <section className="card space-y-4">
      <div><h2 className="text-lg font-semibold">{t('documents.title')}</h2><p className="text-xs text-slate-500">{t('documents.privacy')}</p></div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block"><span className="label">{t('documents.type')}</span><select className="field w-auto" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((x) => <option key={x} value={x}>{t(`documents.types.${x}`)}</option>)}</select></label>
        <label className="block min-w-[10rem] flex-1"><span className="label">{t('documents.label')} ({t('common.optional')})</span><input className="field" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} /></label>
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" onChange={onFile} aria-label={t('documents.upload')} />
        <Button loading={busy} onClick={() => input.current?.click()}><Upload size={16} />{t('documents.upload')}</Button>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={1} skeletonClass="h-12">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data?.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
              <FileText size={20} className="shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t(`documents.types.${d.type}`)}{d.label && ` — ${d.label}`}</p><p className="text-xs text-slate-500">{formatDate(d.createdAt, i18n.language)}{d.reviewNote && ` · ${d.reviewNote}`}</p></div>
              <Badge tone={TONE[d.status]}>{t(`documents.status.${d.status}`)}</Badge>
              <button className="btn-ghost p-1.5" onClick={() => view(d.id)} aria-label={t('documents.view')} title={t('documents.view')}><Eye size={16} /></button>
              {d.status !== 'verified' && <button className="btn-ghost p-1.5 text-red-600" onClick={() => setToDelete(d)} aria-label={t('cms.delete')} title={t('cms.delete')}><Trash2 size={16} /></button>}
            </li>
          ))}
        </ul>
      </DataState>
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} danger title={t('cms.delete')} message={t('documents.deleteConfirm')} confirmLabel={t('cms.delete')} onConfirm={remove} />
    </section>
  );
}
