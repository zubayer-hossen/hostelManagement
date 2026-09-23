import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { authApi } from '../../api/auth.js';
import { forgotSchema } from '../../validations/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setError(null);
    try {
      await authApi.forgotPassword(values);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">{t('auth.forgotTitle')}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('auth.forgotSubtitle')}</p>

      {sent ? (
        <div className="mt-6 space-y-4">
          <Alert tone="success">{t('auth.resetSent')}</Alert>
          <Link to="/login" className="btn-secondary w-full">{t('auth.backToLogin')}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Input label={t('common.email')} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" loading={isSubmitting} className="w-full">{t('auth.sendLink')}</Button>
          <Link to="/login" className="block text-center text-sm font-medium text-primary-600 hover:underline">{t('auth.backToLogin')}</Link>
        </form>
      )}
    </>
  );
}
