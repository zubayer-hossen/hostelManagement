import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Eye, Globe, Users } from 'lucide-react';
import DataState from '../../components/DataState.jsx';
import BarChart from '../../components/BarChart.jsx';
import Forbidden from '../Forbidden.jsx';
import { trackingApi } from '../../api/tracking.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';

function Stat({ icon: Icon, label, value, tone = 'text-primary-600' }) {
  return <div className="card"><Icon className={tone} size={22} /><p className="mt-2 text-xs text-slate-500">{label}</p><p className="text-2xl font-extrabold">{value}</p></div>;
}

function Ranked({ title, rows, empty }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-slate-600 dark:text-slate-300" title={r.label}>{r.label}</span>
              <span className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-2 rounded-full bg-primary-500" style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }} /></span>
              <span className="w-10 text-right font-semibold">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useFetch(() => trackingApi.visitors(days), [days]);

  // keep the "online now" numbers fresh
  useEffect(() => { const id = setInterval(reload, 30000); return () => clearInterval(id); }, [reload]);
  if (!hasPermission('viewAnalytics')) return <Forbidden />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('visitors.title')}</h1>
        <select className="field w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t('visitors.range')}>{[7, 30, 90].map((d) => <option key={d} value={d}>{t('visitors.lastDays', { n: d })}</option>)}</select>
      </div>
      <p className="text-xs text-slate-500">{t('visitors.privacy')}</p>
      <DataState loading={loading && !data} error={error && !data} onRetry={reload} skeletons={4} skeletonClass="h-24">
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={Activity} label={t('visitors.onlineNow')} value={data.activeNow} tone="text-emerald-600" />
              <Stat icon={Users} label={t('visitors.todayLabel')} value={data.today} />
              <Stat icon={Eye} label={t('visitors.thisMonth')} value={data.thisMonth} />
              <Stat icon={Globe} label={t('visitors.lifetime')} value={data.lifetime} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card"><h3 className="mb-3 text-sm font-semibold">{t('visitors.dailyVisitors')}</h3><BarChart data={data.series.map((s) => ({ label: s.day, value: s.visitors }))} ariaLabel={t('visitors.dailyVisitors')} /></div>
              <div className="card"><h3 className="mb-3 text-sm font-semibold">{t('visitors.dailyViews')}</h3><BarChart data={data.series.map((s) => ({ label: s.day, value: s.pageviews }))} ariaLabel={t('visitors.dailyViews')} /></div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Ranked title={t('visitors.activeByPage')} rows={data.activeByPage} empty={t('visitors.nobody')} />
              <Ranked title={t('visitors.topPages')} rows={data.topPages} empty="—" />
              <Ranked title={t('visitors.devices')} rows={data.devices.map((d) => ({ ...d, label: t(`visitors.device.${d.label}`, { defaultValue: d.label }) }))} empty="—" />
              <Ranked title={t('visitors.referrers')} rows={data.referrers} empty={t('visitors.noReferrers')} />
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
