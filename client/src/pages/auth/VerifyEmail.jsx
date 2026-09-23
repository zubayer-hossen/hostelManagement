import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { authApi } from '../../api/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState(token ? 'loading' : 'invalid'); // loading | ok | invalid | error
  const [message, setMessage] = useState('');
  const started = useRef(false); // guards React StrictMode's double effect (the token is single-use)

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authApi
      .verifyEmail({ token })
      .then(() => setState('ok'))
      .catch((err) => {
        setMessage(getErrorMessage(err, t('errors.generic')));
        setState('error');
      });
  }, [token, t]);

  return (
    <div className="space-y-4 text-center">
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6 text-primary-600">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-slate-500">{t('auth.verifying')}</p>
        </div>
      )}
      {state === 'ok' && <Alert tone="success" title={t('auth.verifiedTitle')}>{t('auth.verifiedText')}</Alert>}
      {state === 'invalid' && <Alert tone="error">{t('auth.invalidLink')}</Alert>}
      {state === 'error' && <Alert tone="error" title={t('auth.verifyFailedTitle')}>{message}</Alert>}
      {state !== 'loading' && <Link to="/login" className="btn-primary w-full">{t('common.login')}</Link>}
    </div>
  );
}
