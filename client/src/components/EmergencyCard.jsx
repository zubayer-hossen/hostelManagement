import { PhoneCall, Siren } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext.jsx';
import { telHref } from '../utils/links.js';

/** One-tap emergency numbers (mobile friendly). Renders nothing until the admin fills at least one number. */
export default function EmergencyCard() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const e = settings.emergency || {};
  const rows = [
    ['hostelContact', e.hostelContact || settings.contact.emergencyPhone],
    ['police', e.police],
    ['ambulance', e.ambulance],
    ['fire', e.fire],
    ['hospital', e.hospital],
  ].filter(([, v]) => v);
  if (!rows.length) return null;

  return (
    <div className="card border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20">
      <h2 className="flex items-center gap-2 text-lg font-bold text-red-700 dark:text-red-300"><Siren size={20} /> {t('public.contact.emergency')}</h2>
      <ul className="mt-3 space-y-2">
        {rows.map(([key, value]) => (
          <li key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600 dark:text-slate-300">{t(`public.contact.${key}`)}</span>
            {key === 'hospital' && !/\d/.test(value)
              ? <span className="font-semibold">{value}</span>
              : <a href={telHref(value)} className="inline-flex items-center gap-1.5 font-semibold text-red-700 hover:underline dark:text-red-300"><PhoneCall size={14} />{value}</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
