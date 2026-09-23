import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ResidentPanel from '../resident/ResidentPanel.jsx';
import AdminOverview from './AdminOverview.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.js';
import { describeDevice, formatDate, formatDateTime } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

export default function DashboardHome() {
  const { t, i18n } = useTranslation();
  const { user, permissions, hasPermission } = useAuth();
  const [history, setHistory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    authApi.loginHistory()
      .then((res) => { if (!cancelled) setHistory(res.data); })
      .catch(() => { if (!cancelled) setHistory([]); });
    return () => { cancelled = true; };
  }, []);

  const resend = async () => {
    try {
      await authApi.resendVerification({ email: user.email });
      toast.success(t('dashboard.resent'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t('dashboard.welcome', { name: user.name })}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
      </div>

      {!user.emailVerified && (
        <Alert
          tone="info"
          title={t('dashboard.emailUnverifiedTitle')}
          action={<button onClick={resend} className="shrink-0 text-sm font-semibold underline">{t('dashboard.resend')}</button>}
        >
          {t('dashboard.emailUnverifiedText', { email: user.email })}
        </Alert>
      )}

      {user.role === 'hostel_resident' && <ResidentPanel />}
      {hasPermission('viewAnalytics') && <AdminOverview />}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-semibold">{t('dashboard.account')}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">{t('common.email')}</dt><dd className="truncate font-medium">{user.email}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">{t('dashboard.role')}</dt><dd><Badge tone="primary">{t(`roles.${user.role}`)}</Badge></dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">{t('dashboard.memberSince')}</dt><dd className="font-medium">{formatDate(user.createdAt, i18n.language)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">{t('dashboard.lastLogin')}</dt><dd className="font-medium">{formatDateTime(user.lastLoginAt, i18n.language)}</dd></div>
          </dl>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold">{t('dashboard.permissions')}</h2>
          {permissions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t('dashboard.noPermissions')}</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-2">
              {permissions.map((p) => <li key={p}><Badge>{p}</Badge></li>)}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold">{t('dashboard.recentLogins')}</h2>
        {history === null ? (
          <div className="flex justify-center py-8 text-primary-600"><Spinner /></div>
        ) : history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t('dashboard.noActivity')}</p>
        ) : (
          <div className="-mx-2 mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-medium">{t('dashboard.when')}</th>
                  <th className="px-2 py-2 font-medium">{t('dashboard.device')}</th>
                  <th className="px-2 py-2 font-medium">{t('dashboard.ip')}</th>
                  <th className="px-2 py-2 font-medium">{t('dashboard.result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap px-2 py-2.5">{formatDateTime(h.createdAt, i18n.language)}</td>
                    <td className="px-2 py-2.5">{describeDevice(h.userAgent)}</td>
                    <td className="px-2 py-2.5 text-slate-500">{h.ip || '—'}</td>
                    <td className="px-2 py-2.5"><Badge tone={h.success ? 'green' : 'red'}>{h.success ? t('dashboard.success') : t('dashboard.failed')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
