import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BedDouble, ClipboardList, LifeBuoy, UserPlus, Users, Wallet } from 'lucide-react';
import DataState from '../../components/DataState.jsx';
import BarChart from '../../components/BarChart.jsx';
import { mediaApi } from '../../api/media.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatPrice } from '../../utils/format.js';

function Stat({ icon: Icon, label, value, sub, to, tone = 'text-primary-600' }) {
  const body = (
    <div className="card h-full transition hover:shadow-glow">
      <Icon className={tone} size={22} />
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

/** Numbers computed from real data by GET /analytics/overview. Visitor analytics arrive in Phase 7. */
export default function AdminOverview() {
  const { t } = useTranslation();
  const { data: d, loading, error, reload } = useFetch(() => mediaApi.overview(), []);
  return (
    <DataState loading={loading} error={error} onRetry={reload} skeletons={4} skeletonClass="h-28">
      {d && (
        <section aria-label={t('overview.title')} className="space-y-6">
          <h2 className="text-lg font-semibold">{t('overview.title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label={t('overview.residents')} value={d.residents.total} sub={`${t('public.hostelType.boys')} ${d.residents.boys} · ${t('public.hostelType.girls')} ${d.residents.girls}`} to="/dashboard/manage/residents" />
            <Stat icon={BedDouble} label={t('overview.availableBeds')} value={`${d.beds.available} / ${d.beds.total}`} sub={t('overview.occupancy', { rate: d.beds.occupancyRate })} to="/dashboard/manage/rooms" />
            <Stat icon={ClipboardList} label={t('overview.pendingBookings')} value={d.bookings.pending} to="/dashboard/manage/bookings" tone={d.bookings.pending ? 'text-amber-600' : 'text-primary-600'} />
            <Stat icon={LifeBuoy} label={t('overview.openComplaints')} value={d.complaints.open} to="/dashboard/manage/complaints" tone={d.complaints.open ? 'text-amber-600' : 'text-primary-600'} />
            <Stat icon={Wallet} label={t('finance.totalOutstanding')} value={formatPrice(d.finance.totalOutstanding)} sub={t('overview.overdueDues', { count: d.finance.overdueCount })} to="/dashboard/manage/finance" tone="text-red-600" />
            <Stat icon={Wallet} label={t('finance.collectedThisMonth')} value={formatPrice(d.finance.collectedThisMonth)} tone="text-emerald-600" />
            <Stat icon={UserPlus} label={t('overview.newUsers')} value={d.newUsers30Days} sub={t('overview.last30')} />
            <Stat icon={BedDouble} label={t('overview.rooms')} value={d.rooms.total} sub={`${d.beds.maintenance} ${t('overview.bedsRepair')}`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card"><h3 className="mb-3 text-sm font-semibold">{t('overview.monthlyCollection')}</h3><BarChart data={d.monthlyCollection.map((m) => ({ label: m.label, value: m.total }))} format={formatPrice} ariaLabel={t('overview.monthlyCollection')} /></div>
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold">{t('overview.bookingsByStatus')}</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(d.bookings.byStatus).length === 0 && <li className="text-slate-500">—</li>}
                {Object.entries(d.bookings.byStatus).map(([s, n]) => (
                  <li key={s} className="flex items-center gap-3"><span className="w-28 shrink-0 text-slate-600 dark:text-slate-300">{t(`bookings.status.${s}`)}</span>
                    <span className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-2 rounded-full bg-primary-500" style={{ width: `${Math.max(4, (n / Math.max(...Object.values(d.bookings.byStatus))) * 100)}%` }} /></span>
                    <span className="w-8 text-right font-semibold">{n}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </DataState>
  );
}
