import { Moon, Sun, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';

const OPTIONS = [
  { value: 'light', icon: Sun },
  { value: 'system', icon: Monitor },
  { value: 'dark', icon: Moon },
];

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();
  return (
    <div role="group" aria-label={t('common.theme')} className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
      {OPTIONS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          aria-pressed={mode === value}
          aria-label={t(`common.${value}`)}
          title={t(`common.${value}`)}
          className={`rounded-md p-1.5 transition ${mode === value ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
