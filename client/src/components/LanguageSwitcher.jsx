import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { LANGUAGES, changeLanguage } from '../i18n/index.js';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t('common.language')}</span>
      <Languages size={16} className="pointer-events-none absolute left-2.5 text-slate-500" />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
