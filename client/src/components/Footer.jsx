import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Music2, Phone, Siren, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandMark from './BrandMark.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { DEFAULT_NAV } from '../constants/site.js';
import { telHref } from '../utils/links.js';

const SOCIALS = [
  ['facebook', Facebook, 'Facebook'], ['instagram', Instagram, 'Instagram'], ['youtube', Youtube, 'YouTube'],
  ['whatsapp', MessageCircle, 'WhatsApp'], ['messenger', MessageCircle, 'Messenger'], ['tiktok', Music2, 'TikTok'], ['linkedin', Linkedin, 'LinkedIn'],
];

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const { general, contact, social, footer } = settings;
  const nav = (settings.navigation?.length ? settings.navigation : DEFAULT_NAV).filter((i) => i.enabled && i.path !== '/');
  const emergencyPhone = settings.emergency?.hostelContact || contact.emergencyPhone;

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandMark />
          {general.description && <p className="text-sm text-slate-600 dark:text-slate-400">{general.description}</p>}
          <div className="flex flex-wrap gap-2">
            {SOCIALS.filter(([k]) => social?.[k]).map(([k, Icon, name]) => (
              <a key={k} href={social[k]} target="_blank" rel="noopener noreferrer" aria-label={name} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-primary-600 hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {footer?.showQuickLinks !== false && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">{t('public.footer.quickLinks')}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {nav.map((i) => (
                <li key={i.key}><Link to={i.path} className="text-slate-600 hover:text-primary-600 dark:text-slate-400">{i18n.language === 'bn' && i.labelBn ? i.labelBn : i.label}</Link></li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">{t('public.footer.legal')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/rules" className="text-slate-600 hover:text-primary-600 dark:text-slate-400">{t('public.footer.rules')}</Link></li>
            <li><Link to="/terms" className="text-slate-600 hover:text-primary-600 dark:text-slate-400">{t('public.footer.terms')}</Link></li>
            <li><Link to="/privacy" className="text-slate-600 hover:text-primary-600 dark:text-slate-400">{t('public.footer.privacy')}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">{t('public.footer.contact')}</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            {general.address && <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-primary-600" />{general.address}</li>}
            {contact.phone && <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-primary-600" /><a href={telHref(contact.phone)} className="hover:underline">{contact.phone}</a></li>}
            {contact.email && <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-primary-600" /><a href={`mailto:${contact.email}`} className="break-all hover:underline">{contact.email}</a></li>}
            {emergencyPhone && <li className="flex gap-2"><Siren size={16} className="mt-0.5 shrink-0 text-red-600" /><a href={telHref(emergencyPhone)} className="font-medium text-red-700 hover:underline dark:text-red-300">{t('public.contact.emergency')}: {emergencyPhone}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-500 dark:border-slate-800">
        {footer?.copyrightText || `© ${new Date().getFullYear()} ${general.hostelName}. ${t('common.allRightsReserved')}`}
      </div>
    </footer>
  );
}
