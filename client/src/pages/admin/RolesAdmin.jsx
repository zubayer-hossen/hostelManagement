import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { rolesApi } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../utils/errors.js';

function RoleCard({ role, catalog, mine, myLevel, isSuper, onSaved }) {
  const { t } = useTranslation();
  const [perms, setPerms] = useState(role.permissions);
  const [busy, setBusy] = useState(false);
  const locked = role.key === 'super_admin' || (!isSuper && role.level >= myLevel);
  const dirty = perms.length !== role.permissions.length || perms.some((p) => !role.permissions.includes(p));
  const toggle = (p) => setPerms((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));

  const save = async () => {
    setBusy(true);
    try { await rolesApi.setPermissions(role.key, perms); toast.success(t('cms.saved')); onSaved(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-lg font-semibold">{t(`roles.${role.key}`)}</h2><p className="text-sm text-slate-500">{role.description}</p></div>
        {locked && <Badge>{t('admin.roles.locked')}</Badge>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((p) => {
          const canGrant = isSuper || mine.includes(p);
          return <label key={p} className={`flex items-center gap-2 text-sm ${!canGrant && !perms.includes(p) ? 'opacity-40' : ''}`}><input type="checkbox" checked={perms.includes(p)} disabled={locked || (!canGrant && !perms.includes(p))} onChange={() => toggle(p)} />{p}</label>;
        })}
      </div>
      {!locked && <div className="text-right"><Button loading={busy} disabled={!dirty} onClick={save}>{t('common.save')}</Button></div>}
    </section>
  );
}

export default function RolesAdmin() {
  const { t } = useTranslation();
  const { user, permissions } = useAuth();
  const { data, loading, error, reload } = useFetch(() => rolesApi.list(), []);
  const myLevel = data?.roles.find((r) => r.key === user.role)?.level ?? 0;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold sm:text-3xl">{t('admin.roles.title')}</h1><p className="text-sm text-slate-500">{t('admin.roles.hint')}</p></div>
      <DataState loading={loading} error={error} onRetry={reload} skeletons={2} skeletonClass="h-40">
        <div className="space-y-5">
          {data?.roles.map((r) => <RoleCard key={`${r.key}-${JSON.stringify(r.permissions)}`} role={r} catalog={data.permissionCatalog} mine={permissions} myLevel={myLevel} isSuper={user.role === 'super_admin'} onSaved={reload} />)}
        </div>
      </DataState>
    </div>
  );
}
