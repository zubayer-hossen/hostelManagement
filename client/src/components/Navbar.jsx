import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandMark from './BrandMark.jsx';
import ThemeSwitcher from './ThemeSwitcher.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { DEFAULT_NAV } from '../constants/site.js';

/** Public navbar. Items, labels (EN/BN) and visibility come from Admin → Settings → Navigation. */
export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const items = useMemo(() => {
    const source = settings.navigation?.length ? settings.navigation : DEFAULT_NAV;
    return source.filter((i) => i.enabled);
  }, [settings.navigation]);

  const label = (i) => (i18n.language === 'bn' && i.labelBn ? i.labelBn : i.label);
  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`;

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <BrandMark className="min-w-0" />

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {items.map((i) => <NavLink key={i.key} to={i.path} end={i.path === '/'} className={linkClass}>{label(i)}</NavLink>)}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block"><ThemeSwitcher /></div>
          <LanguageSwitcher />
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary hidden sm:inline-flex">{t('common.dashboard')}</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost hidden md:inline-flex">{t('common.login')}</Link>
              <Link to="/register" className="btn-primary hidden sm:inline-flex">{t('common.register')}</Link>
            </>
          )}
          <button className="btn-ghost p-2 xl:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t('common.closeMenu') : t('common.openMenu')}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="max-h-[80vh] overflow-y-auto border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 xl:hidden">
          <div className="grid gap-1 sm:grid-cols-2">
            {items.map((i) => <NavLink key={i.key} to={i.path} end={i.path === '/'} className={linkClass}>{label(i)}</NavLink>)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <ThemeSwitcher />
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary ml-auto">{t('common.dashboard')}</Link>
            ) : (
              <div className="ml-auto flex gap-2">
                <Link to="/login" className="btn-secondary">{t('common.login')}</Link>
                <Link to="/register" className="btn-primary">{t('common.register')}</Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
