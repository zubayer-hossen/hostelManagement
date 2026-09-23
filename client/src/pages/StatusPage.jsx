import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** Shared layout for 403 / 404 style pages. */
export default function StatusPage({ code, titleKey, textKey }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-20 text-center">
      <div>
        <p className="text-6xl font-extrabold text-primary-600">{code}</p>
        <h1 className="mt-4 text-2xl font-bold">{t(titleKey)}</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-500 dark:text-slate-400">{t(textKey)}</p>
        <Link to="/" className="btn-primary mt-8">{t('common.backHome')}</Link>
      </div>
    </div>
  );
}
