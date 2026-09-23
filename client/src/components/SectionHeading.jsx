import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SectionHeading({ title, subtitle, to }) {
  const { t } = useTranslation();
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline">
          {t('public.viewAll')} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
