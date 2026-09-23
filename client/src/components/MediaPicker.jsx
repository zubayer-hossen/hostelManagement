import { useRef, useState } from 'react';
import { Search, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import DataState from './DataState.jsx';
import Pagination from './ui/Pagination.jsx';
import { mediaApi } from '../api/media.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { getErrorMessage } from '../utils/errors.js';

export const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
export const MAX_MB = 5;

/** Upload helper shared by the picker and the library page. Returns the created media or null. */
export async function uploadFile(file, purpose, t) {
  if (!file) return null;
  if (file.size > MAX_MB * 1024 * 1024) { toast.error(t('media.tooLarge', { mb: MAX_MB })); return null; }
  try { const res = await mediaApi.upload(file, { purpose }); toast.success(t('media.uploaded')); return res.data; } catch (err) { toast.error(getErrorMessage(err)); return null; }
}

/** Modal: choose an image from the library or upload a new one. Calls onPick(url). */
export default function MediaPicker({ open, onClose, onPick, purpose = 'general' }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const q = useDebounce(search);
  const { data, meta, loading, error, reload } = useFetch(() => (open ? mediaApi.list({ page, limit: 12, ...(q && { search: q }) }) : Promise.resolve({ data: [] })), [open, page, q]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setBusy(true);
    const media = await uploadFile(file, purpose, t);
    setBusy(false);
    if (media) { onPick(media.url); onClose(); }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('media.choose')} size="lg">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('cms.search')} aria-label={t('cms.search')} /></div>
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" onChange={onFile} aria-label={t('media.upload')} />
        <Button loading={busy} onClick={() => input.current?.click()}><Upload size={16} />{t('media.upload')}</Button>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={6} skeletonClass="h-28">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {data?.map((m) => (
            <li key={m.id}><button type="button" onClick={() => { onPick(m.url); onClose(); }} className="group block w-full overflow-hidden rounded-lg border border-slate-200 text-left hover:border-primary-500 dark:border-slate-700">
              <img src={m.url} alt={m.altText || m.originalName} loading="lazy" className="h-24 w-full object-cover transition group-hover:scale-105" />
              <span className="block truncate px-2 py-1 text-xs text-slate-500">{m.originalName || m.altText || '—'}</span>
            </button></li>
          ))}
        </ul>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
    </Modal>
  );
}
