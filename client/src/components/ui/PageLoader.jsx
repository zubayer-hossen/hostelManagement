import { useTranslation } from 'react-i18next';
import Spinner from './Spinner.jsx';

export default function PageLoader({ fullScreen = true }) {
  const { t } = useTranslation();
  return (
    <div role="status" className={`flex items-center justify-center text-primary-600 ${fullScreen ? 'min-h-screen' : 'py-20'}`}>
      <Spinner className="h-8 w-8" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
