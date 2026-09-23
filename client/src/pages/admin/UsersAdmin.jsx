import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { usersApi, rolesApi } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate } from '../../utils/format.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

const ROLE_KEYS = ['super_admin', 'owner', 'manager', 'admin', 'hostel_resident', 'general_user'];

/** Roles the current user may hand out (strictly below their own, Super Admin: any). Server enforces this too. */
function useAssignableRoles() {
  const { user } = useAuth();
  const { data } = useFetch(() => rolesApi.list(), []);
  const levels = Object.fromEntries((data?.roles || []).map((r) => [r.key, r.level]));
  const mine = levels[user.role] ?? 0;
  return ROLE_KEYS.filter((k) => user.role === 'super_admin' || (levels[k] ?? 0) < mine);
}

function UserForm({ item, roles, onClose, onSaved }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const editing = Boolean(item);
  const [v, setV] = useState({ name: item?.name || '', email: item?.email || '', phone: item?.phone || '', password: '', role: item?.role || roles[roles.length - 1] || 'general_user', isActive: item?.isActive ?? true });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (editing) {
        await usersApi.update(item.id, { name: v.name.trim(), phone: v.phone.trim(), isActive: v.isActive });
        if (v.role !== item.role && hasPermission('manageRoles')) await usersApi.setRole(item.id, v.role);
      } else {
        await usersApi.create({ name: v.name.trim(), email: v.email.trim(), ...(v.phone.trim() && { phone: v.phone.trim() }), password: v.password, role: v.role });
      }
      toast.success(t('cms.saved')); onSaved(); onClose();
    } catch (err) {
      setError(getFieldErrors(err).map((x) => `${x.field}: ${x.message}`).join(' · ') || getErrorMessage(err));
    } finally { setBusy(false); }
  };

  const roleChoices = editing && !roles.includes(item.role) ? [item.role, ...roles] : roles;
  const roleLocked = editing && !hasPermission('manageRoles');
  return (
    <Modal open onClose={onClose} title={editing ? t('admin.users.edit') : t('admin.users.new')}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <label className="block"><span className="label">{t('common.name')}</span><input className="field" required minLength={2} maxLength={80} value={v.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="block"><span className="label">{t('common.email')}</span><input className="field" type="email" required disabled={editing} value={v.email} onChange={(e) => set('email', e.target.value)} /></label>
        <label className="block"><span className="label">{t('common.phone')} ({t('common.optional')})</span><input className="field" type="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        {!editing && <label className="block"><span className="label">{t('common.password')}</span><input className="field" type="password" required minLength={8} autoComplete="new-password" value={v.password} onChange={(e) => set('password', e.target.value)} /><span className="mt-1 block text-xs text-slate-500">{t('profile.passwordRules')}</span></label>}
        <label className="block"><span className="label">{t('dashboard.role')}</span>
          <select className="field" value={v.role} disabled={roleLocked || (editing && !roleChoices.includes(item.role))} onChange={(e) => set('role', e.target.value)}>{roleChoices.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}</select></label>
        {editing && <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={v.isActive} onChange={(e) => set('isActive', e.target.checked)} />{t('cms.active')}</label>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" loading={busy}>{t('common.save')}</Button></div>
      </form>
    </Modal>
  );
}

export default function UsersAdmin() {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const roles = useAssignableRoles();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const q = useDebounce(search);
  useEffect(() => setPage(1), [q, role, active]);
  const params = { page, limit: 15, ...(q && { search: q }), ...(role && { role }), ...(active && { isActive: active }) };
  const { data, meta, loading, error, reload } = useFetch(() => usersApi.list(params), [JSON.stringify(params)]);

  const remove = async () => {
    try { await usersApi.remove(toDelete.id); toast.success(t('cms.deleted')); reload(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('admin.users.title')}</h1><Button onClick={() => setForm('new')}><Plus size={16} />{t('admin.users.new')}</Button></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" className="field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('bookings.searchPlaceholder')} aria-label={t('bookings.searchPlaceholder')} /></div>
        <select className="field w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label={t('dashboard.role')}><option value="">{t('public.hostelType.all')}</option>{ROLE_KEYS.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}</select>
        <select className="field w-auto" value={active} onChange={(e) => setActive(e.target.value)} aria-label={t('bookings.statusLabel')}><option value="">{t('public.hostelType.all')}</option><option value="true">{t('cms.active')}</option><option value="false">{t('cms.inactive')}</option></select>
      </div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-14">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['common.name', 'common.email', 'dashboard.role', 'bookings.statusLabel', 'dashboard.lastLogin', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="break-all px-4 py-3">{u.email}{!u.emailVerified && <Badge tone="amber" className="ml-2">{t('admin.users.unverified')}</Badge>}</td>
                  <td className="px-4 py-3"><Badge tone="primary">{t(`roles.${u.role}`)}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={u.isActive ? 'green' : 'slate'}>{u.isActive ? t('cms.active') : t('cms.inactive')}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3">{u.lastLoginAt ? formatDate(u.lastLoginAt, i18n.language) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="btn-ghost py-1.5" onClick={() => setForm(u)}>{t('staff.edit')}</button>
                    {u.id !== me.id && <button className="btn-ghost py-1.5 text-red-600" onClick={() => setToDelete(u)}>{t('cms.delete')}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>
      {form && <UserForm item={form === 'new' ? null : form} roles={roles} onClose={() => setForm(null)} onSaved={reload} />}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} danger title={t('cms.delete')} message={t('admin.users.deleteConfirm', { name: toDelete?.name })} confirmLabel={t('cms.delete')} onConfirm={remove} />
    </div>
  );
}
