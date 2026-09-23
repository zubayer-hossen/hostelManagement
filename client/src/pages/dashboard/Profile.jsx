import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Laptop } from 'lucide-react';
import Input from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.js';
import { changePasswordSchema, profileSchema } from '../../validations/auth.js';
import { describeDevice, formatDateTime } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

function ProfileForm() {
  const { t } = useTranslation();
  const { user, reloadUser } = useAuth();
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone || '' },
  });

  const onSubmit = async (values) => {
    setError(null);
    try {
      await authApi.updateMe(values);
      const fresh = await reloadUser();
      reset({ name: fresh.name, phone: fresh.phone || '' });
      toast.success(t('profile.saved'));
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
    }
  };

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">{t('profile.personal')}</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('common.name')} error={errors.name?.message} {...register('name')} />
          <Input label={t('common.phone')} type="tel" error={errors.phone?.message} {...register('phone')} />
        </div>
        <Input label={t('common.email')} value={user.email} disabled readOnly />
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>{isSubmitting ? t('common.saving') : t('common.save')}</Button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setError(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success(t('profile.passwordChanged'));
      reset();
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
    }
  };

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">{t('profile.changePassword')}</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <PasswordInput label={t('profile.currentPassword')} autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput label={t('profile.newPassword')} autoComplete="new-password" hint={t('profile.passwordRules')} error={errors.newPassword?.message} {...register('newPassword')} />
          <PasswordInput label={t('common.confirmPassword')} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </div>
        <Button type="submit" loading={isSubmitting}>{t('profile.changePassword')}</Button>
      </form>
    </section>
  );
}

function Sessions() {
  const { t, i18n } = useTranslation();
  const { logoutAll } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await authApi.sessions();
      setSessions(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSessions([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const revoke = async (id) => {
    setBusyId(id);
    try {
      await authApi.revokeSession(id);
      toast.success(t('profile.revoked'));
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    toast.success(t('profile.loggedOutAll'));
    navigate('/login', { replace: true });
  };

  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('profile.sessions')}</h2>
          <p className="text-sm text-slate-500">{t('profile.sessionsHint')}</p>
        </div>
        <Button variant="danger" onClick={handleLogoutAll}>{t('profile.logoutAll')}</Button>
      </div>

      {sessions === null ? (
        <div className="flex justify-center py-8 text-primary-600"><Spinner /></div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <Laptop size={20} className="shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{describeDevice(s.userAgent)} {s.current && <Badge tone="green" className="ml-1">{t('profile.current')}</Badge>}</p>
                <p className="text-xs text-slate-500">{t('profile.lastActive')}: {formatDateTime(s.lastUsedAt, i18n.language)} · {s.ip || '—'}</p>
              </div>
              {!s.current && <Button variant="secondary" loading={busyId === s.id} onClick={() => revoke(s.id)}>{t('profile.revoke')}</Button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('profile.title')}</h1>
      <ProfileForm />
      <PasswordForm />
      <Sessions />
    </div>
  );
}
