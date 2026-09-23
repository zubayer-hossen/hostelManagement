import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Input from './ui/Input.jsx';
import Button from './ui/Button.jsx';
import Alert from './ui/Alert.jsx';
import { contentApi } from '../api/content.js';
import { contactSchema } from '../validations/contact.js';
import { getErrorMessage } from '../utils/errors.js';

export default function ContactForm() {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '', website: '' },
  });

  const onSubmit = async (values) => {
    setError(null);
    try {
      const body = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
      await contentApi.sendContact({ ...body, website: values.website });
      toast.success(t('public.contact.sent'));
      setSent(true);
      reset();
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert tone="success">{t('public.contact.sent')}</Alert>
        <Button variant="secondary" onClick={() => setSent(false)}>{t('public.contact.sendAnother')}</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('common.name')} autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label={t('common.email')} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label={t('common.phone')} type="tel" optional error={errors.phone?.message} {...register('phone')} />
        <Input label={t('public.contact.subject')} optional error={errors.subject?.message} {...register('subject')} />
      </div>
      <div>
        <label htmlFor="contact-message" className="label">{t('public.contact.message')}</label>
        <textarea id="contact-message" rows={5} className={`field ${errors.message ? 'field-error' : ''}`} aria-invalid={errors.message ? 'true' : undefined} {...register('message')} />
        {errors.message && <p role="alert" className="mt-1.5 text-xs text-red-600">{t(errors.message.message, { defaultValue: errors.message.message })}</p>}
      </div>
      {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" {...register('website')} /></label>
      </div>
      <Button type="submit" loading={isSubmitting}>{t('public.contact.send')}</Button>
    </form>
  );
}
