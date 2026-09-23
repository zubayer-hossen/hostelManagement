import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { registerSchema } from '../../validations/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function Register() {
  const { t } = useTranslation();
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [verifyNotice, setVerifyNotice] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ confirmPassword, phone, ...values }) => {
    setError(null);
    try {
      const payload = phone ? { ...values, phone } : values;
      const result = await signUp(payload);
      if (result.requiresVerification) {
        setVerifyNotice(true);
        return;
      }
      toast.success(t('auth.accountCreated'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
    }
  };

  if (verifyNotice) {
    return (
      <div className="space-y-4 text-center">
        <Alert tone="success">{t('auth.verifyNeeded')}</Alert>
        <Link to="/login" className="btn-primary w-full">{t('auth.backToLogin')}</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold">{t('auth.registerTitle')}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('auth.registerSubtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Input label={t('common.name')} autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label={t('common.email')} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label={t('common.phone')} type="tel" autoComplete="tel" optional error={errors.phone?.message} {...register('phone')} />
        <PasswordInput label={t('common.password')} autoComplete="new-password" hint={t('profile.passwordRules')} error={errors.password?.message} {...register('password')} />
        <PasswordInput label={t('common.confirmPassword')} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={isSubmitting} className="w-full">{t('common.register')}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('auth.haveAccount')} <Link to="/login" className="font-semibold text-primary-600 hover:underline">{t('common.login')}</Link>
      </p>
    </>
  );
}
