import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import ContactForm from '../components/ContactForm.jsx';
import EmergencyCard from '../components/EmergencyCard.jsx';
import MapEmbed from '../components/MapEmbed.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { telHref } from '../utils/links.js';

export default function ContactPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  usePageTitle(t('public.contact.title'));
  const { address } = settings.general;
  const { phone, email, officeHours, supportInfo } = settings.contact;

  return (
    <>
      <PageHeader title={t('public.contact.title')} subtitle={t('public.contact.subtitle')} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <ul className="space-y-4 text-sm">
              {address && <li className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-primary-600" size={18} /><span>{address}</span></li>}
              {phone && <li className="flex gap-3"><Phone className="shrink-0 text-primary-600" size={18} /><a href={telHref(phone)} className="hover:underline">{phone}</a></li>}
              {email && <li className="flex gap-3"><Mail className="shrink-0 text-primary-600" size={18} /><a href={`mailto:${email}`} className="break-all hover:underline">{email}</a></li>}
              {officeHours && <li className="flex gap-3"><Clock className="shrink-0 text-primary-600" size={18} /><span>{officeHours}</span></li>}
            </ul>
            {supportInfo && <p className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">{supportInfo}</p>}
            {!address && !phone && !email && <p className="text-sm text-slate-500">{t('public.contact.notConfigured')}</p>}
          </div>
          <EmergencyCard />
        </div>

        <div className="card lg:col-span-3">
          <h2 className="mb-4 text-xl font-bold">{t('public.contact.formTitle')}</h2>
          <ContactForm />
        </div>

        <div className="lg:col-span-5"><MapEmbed /></div>
      </div>
    </>
  );
}
