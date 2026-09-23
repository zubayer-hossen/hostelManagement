import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.js';
import { loginSchema } from '../../validations/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setError(null);
    setUnverifiedEmail(null);
    try {
      await login(values);
      toast.success(t('auth.loggedIn'));
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(values.email);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendVerification({ email: unverifiedEmail });
      toast.success(t('dashboard.resent'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">{t('auth.loginTitle')}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('auth.loginSubtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {error && (
          <Alert tone="error" action={unverifiedEmail && <button type="button" onClick={resend} className="shrink-0 text-xs font-semibold underline">{t('dashboard.resend')}</button>}>
            {error}
          </Alert>
        )}
        <Input label={t('common.email')} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <PasswordInput label={t('common.password')} autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:underline">{t('auth.forgotLink')}</Link>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">{t('common.login')}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('auth.noAccount')} <Link to="/register" className="font-semibold text-primary-600 hover:underline">{t('common.register')}</Link>
      </p>
    </>
  );
}
