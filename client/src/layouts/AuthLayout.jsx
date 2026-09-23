import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandMark from '../components/BrandMark.jsx';
import ThemeSwitcher from '../components/ThemeSwitcher.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function AuthLayout() {
  const { settings } = useSettings();
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* soft brand-colored background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-secondary-400/25 blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <BrandMark />
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="glass w-full max-w-md rounded-3xl p-6 shadow-soft sm:p-8"
        >
          <Outlet />
        </motion.div>
      </main>

      <p className="pb-6 text-center text-xs text-slate-500">{settings.general.hostelName}</p>
    </div>
  );
}
