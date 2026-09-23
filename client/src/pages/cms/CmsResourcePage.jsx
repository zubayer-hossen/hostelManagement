import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import DataState from '../../components/DataState.jsx';
import FieldInput from '../../components/FieldInput.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Forbidden from '../Forbidden.jsx';
import NotFound from '../NotFound.jsx';
import { cmsApi } from '../../api/admin.js';
import { CMS_RESOURCES } from '../../constants/cmsResources.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { initialValues, toBody } from '../../utils/formFields.js';
import { formatDate } from '../../utils/format.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

function ItemForm({ res, item, onClose, onSaved }) {
  const { t } = useTranslation();
  const api = cmsApi(res.path);
  const [values, setValues] = useState(() => initialValues(res.fields, item));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (name, v) => setValues((s) => ({ ...s, [name]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const body = toBody(res.fields, values);
      if (item) await api.update(item.id, body); else await api.create(body);
      toast.success(t('cms.saved'));
      onSaved(); onClose();
    } catch (err) {
      setError(getFieldErrors(err).map((x) => `${x.field}: ${x.message}`).join(' · ') || getErrorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`${item ? t('cms.edit') : t('cms.new')} — ${t(res.titleKey)}`} size="lg">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          {res.fields.map((fd) => <FieldInput key={fd.name} field={fd} value={values[fd.name]} onChange={set} />)}
        </div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" loading={busy}>{t('common.save')}</Button></div>
      </form>
    </Modal>
  );
}

function Cell({ col, item }) {
  const { t, i18n } = useTranslation();
  const v = item[col.key];
  switch (col.type) {
    case 'thumb': return v ? <img src={v} alt="" loading="lazy" className="h-10 w-14 rounded object-cover" /> : '—';
    case 'date': return v ? formatDate(v, i18n.language) : '—';
    case 'bool': return v ? '✓' : '—';
    case 'list': return (v || []).join(', ') || '—';
    case 'hostel': return t(`public.hostelType.${v}`);
    case 'i18n': return t(`${col.prefix}.${v}`, { defaultValue: v });
    default: return <span className="line-clamp-2">{String(v ?? '—')}</span>;
  }
}

export default function CmsResourcePage() {
  const { resource } = useParams();
  const res = CMS_RESOURCES[resource];
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null | 'new' | item
  const [toDelete, setToDelete] = useState(null);
  const q = useDebounce(search);
  const api = res ? cmsApi(res.path) : null;
  const params = { page, limit: 15, ...(q && { search: q }) };
  const { data, meta, loading, error, reload } = useFetch(() => (api ? api.list(params) : Promise.resolve({ data: [] })), [resource, JSON.stringify(params)]);

  if (!res) return <NotFound />;
  if (!hasPermission(res.permission)) return <Forbidden />;

  const toggleActive = async (item) => {
    try { await api.update(item.id, { isActive: !item.isActive }); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const remove = async () => {
    try { await api.remove(toDelete.id); toast.success(t('cms.deleted')); reload(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <div className="space-y-6" key={resource}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t(res.titleKey)}</h1>
        <Button onClick={() => setForm('new')}><Plus size={16} />{t('cms.new')}</Button>
      </div>
      <div className="relative max-w-md"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('cms.search')} aria-label={t('cms.search')} /></div>

      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>{res.columns.map((c) => <th key={c.key} className="px-4 py-3 font-medium">{t(`cms.fields.${c.key}`)}</th>)}<th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((item) => (
                <tr key={item.id}>
                  {res.columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.type === 'active'
                        ? <button onClick={() => toggleActive(item)} aria-label={t('cms.toggleActive')} title={t('cms.toggleActive')}><Badge tone={item.isActive ? 'green' : 'slate'}>{item.isActive ? t('cms.active') : t('cms.inactive')}</Badge></button>
                        : <Cell col={c} item={item} />}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="btn-ghost py-1.5" onClick={() => setForm(item)}>{t('staff.edit')}</button>
                    <button className="btn-ghost py-1.5 text-red-600" onClick={() => setToDelete(item)}>{t('cms.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>

      {form && <ItemForm res={res} item={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={reload} />}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} danger title={t('cms.delete')} message={t('cms.deleteConfirm')} confirmLabel={t('cms.delete')} onConfirm={remove} />
    </div>
  );
}
