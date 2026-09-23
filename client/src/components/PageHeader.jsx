import { motion } from 'framer-motion';

export default function PageHeader({ title, subtitle }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-400/20 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</motion.h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
    </section>
  );
}
