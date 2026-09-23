import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import BrandMark from '../components/BrandMark.jsx';
import ThemeSwitcher from '../components/ThemeSwitcher.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import Badge from '../components/ui/Badge.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DASHBOARD_NAV } from '../constants/navigation.js';

function SidebarContent({ onNavigate }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { user } = useAuth();
  const items = DASHBOARD_NAV.filter((i) => (!i.permission || hasPermission(i.permission)) && (!i.roles || i.roles.includes(user?.role)));

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1 p-3">
      {items.map(({ to, labelKey, icon: Icon, end, group }, idx) => (
        <div key={to}>
          {group && group !== items[idx - 1]?.group && <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t(group)}</p>}
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {t(labelKey)}
          </NavLink>
        </div>
      ))}
    </nav>
  );
}

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success(t('auth.loggedOut'));
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* desktop sidebar */}
      <aside className="hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="sticky top-0">
          <div className="flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-800"><BrandMark to="/dashboard" /></div>
          <SidebarContent />
        </div>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-slate-900/50" aria-label={t('common.closeMenu')} onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
              <BrandMark to="/dashboard" />
              <button className="btn-ghost p-2" onClick={() => setOpen(false)} aria-label={t('common.closeMenu')}><X size={20} /></button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-x-0 border-t-0 px-4 sm:px-6">
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(true)} aria-label={t('common.openMenu')}><Menu size={20} /></button>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">{user?.name}</p>
              <Badge tone="primary">{t(`roles.${user?.role}`)}</Badge>
            </div>
            <NotificationBell />
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button className="btn-secondary" onClick={handleLogout}>
              <LogOut size={16} />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
