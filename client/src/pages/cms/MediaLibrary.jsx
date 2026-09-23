import { useRef, useState } from 'react';
import { Copy, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { ACCEPT, uploadFile } from '../../components/MediaPicker.jsx';
import { mediaApi } from '../../api/media.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const PURPOSES = ['general', 'banner', 'gallery', 'room', 'facility', 'food', 'notice', 'event', 'blog', 'profile'];
const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function EditModal({ item, onClose, onSaved }) {
  const { t } = useTranslation();
  const [alt, setAlt] = useState(item.altText);
  const [purpose, setPurpose] = useState(item.purpose);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await mediaApi.update(item.id, { altText: alt.trim(), purpose }); toast.success(t('cms.saved')); onSaved(); onClose(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={t('media.details')} size="sm">
      <img src={item.url} alt={item.altText} className="mb-4 max-h-48 w-full rounded-lg object-contain" />
      <label className="block"><span className="label">{t('media.alt')}</span><input className="field" maxLength={200} value={alt} onChange={(e) => setAlt(e.target.value)} /></label>
      <p className="mt-1 text-xs text-slate-500">{t('media.altHint')}</p>
      <label className="mt-4 block"><span className="label">{t('media.purpose')}</span><select className="field" value={purpose} onChange={(e) => setPurpose(e.target.value)}>{PURPOSES.map((p) => <option key={p} value={p}>{t(`media.purposes.${p}`)}</option>)}</select></label>
      <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></div>
    </Modal>
  );
}

export default function MediaLibrary() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [purpose, setPurpose] = useState('');
  const [uploadPurpose, setUploadPurpose] = useState('general');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const [toArchive, setToArchive] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const q = useDebounce(search);
  const params = { page, limit: 18, ...(q && { search: q }), ...(purpose && { purpose }) };
  const { data, meta, loading, error, reload } = useFetch(() => mediaApi.list(params), [JSON.stringify(params)]);

  const onFile = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    setBusy(true);
    for (const f of files) await uploadFile(f, uploadPurpose, t); // one at a time keeps errors readable
    setBusy(false);
    reload();
  };
  const copy = async (url) => { try { await navigator.clipboard.writeText(url); toast.success(t('media.copied')); } catch { toast.error(url); } };
  const archive = async () => {
    try { await mediaApi.archive(toArchive.id); toast.success(t('media.archived')); reload(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('media.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select className="field w-auto" value={uploadPurpose} onChange={(e) => setUploadPurpose(e.target.value)} aria-label={t('media.purpose')}>{PURPOSES.map((p) => <option key={p} value={p}>{t(`media.purposes.${p}`)}</option>)}</select>
          <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" onChange={onFile} aria-label={t('media.upload')} />
          <Button loading={busy} onClick={() => input.current?.click()}><Upload size={16} />{t('media.upload')}</Button>
        </div>
      </div>
      <p className="text-sm text-slate-500">{t('media.rules')}</p>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('cms.search')} aria-label={t('cms.search')} /></div>
        <select className="field w-auto" value={purpose} onChange={(e) => { setPurpose(e.target.value); setPage(1); }} aria-label={t('media.purpose')}><option value="">{t('public.hostelType.all')}</option>{PURPOSES.map((p) => <option key={p} value={p}>{t(`media.purposes.${p}`)}</option>)}</select>
      </div>

      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={6} skeletonClass="h-44">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {data?.map((m) => (
            <li key={m.id} className="card overflow-hidden !p-0">
              <img src={m.url} alt={m.altText || m.originalName} loading="lazy" className="h-28 w-full object-cover" />
              <div className="space-y-1 p-3">
                <p className="truncate text-xs font-medium" title={m.originalName}>{m.originalName || '—'}</p>
                <p className="text-[11px] text-slate-500">{kb(m.size)} · {formatDate(m.createdAt, i18n.language)}</p>
                <div className="flex justify-between pt-1">
                  <button className="btn-ghost p-1.5" onClick={() => copy(m.url)} aria-label={t('media.copyUrl')} title={t('media.copyUrl')}><Copy size={15} /></button>
                  <button className="btn-ghost p-1.5" onClick={() => setEdit(m)} aria-label={t('staff.edit')} title={t('staff.edit')}><Pencil size={15} /></button>
                  <button className="btn-ghost p-1.5 text-red-600" onClick={() => setToArchive(m)} aria-label={t('staff.archive')} title={t('staff.archive')}><Trash2 size={15} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>

      {edit && <EditModal item={edit} onClose={() => setEdit(null)} onSaved={reload} />}
      <ConfirmDialog open={Boolean(toArchive)} onClose={() => setToArchive(null)} danger title={t('staff.archive')} message={t('media.archiveConfirm')} confirmLabel={t('staff.archive')} onConfirm={archive} />
    </div>
  );
}
