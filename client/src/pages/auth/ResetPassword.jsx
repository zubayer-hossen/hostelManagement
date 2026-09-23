import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { authApi } from '../../api/auth.js';
import { resetSchema } from '../../validations/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{t('auth.invalidLink')}</Alert>
        <Link to="/forgot-password" className="btn-primary w-full">{t('auth.sendLink')}</Link>
      </div>
    );
  }

  const onSubmit = async ({ password }) => {
    setError(null);
    try {
      await authApi.resetPassword({ token, password });
      toast.success(t('auth.resetDone'));
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">{t('auth.resetTitle')}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('auth.resetSubtitle')}</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <PasswordInput label={t('profile.newPassword')} autoComplete="new-password" hint={t('profile.passwordRules')} error={errors.password?.message} {...register('password')} />
        <PasswordInput label={t('common.confirmPassword')} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={isSubmitting} className="w-full">{t('auth.resetButton')}</Button>
      </form>
    </>
  );
}
