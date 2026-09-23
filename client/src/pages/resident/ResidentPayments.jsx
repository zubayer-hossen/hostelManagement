import { useTranslation } from 'react-i18next';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { financeApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDate, formatPrice } from '../../utils/format.js';

export const DUE_TONE = { paid: 'green', partially_paid: 'amber', due: 'slate', overdue: 'red', void: 'slate' };

export default function ResidentPayments() {
  const { t, i18n } = useTranslation();
  const dues = useFetch(() => financeApi.myDues(), []);
  const payments = useFetch(() => financeApi.myPayments(), []);
  const owed = (dues.data || []).filter((d) => !d.isVoid).reduce((s, d) => s + d.balance, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('finance.myTitle')}</h1>
        <p className="text-right"><span className="block text-xs text-slate-500">{t('finance.outstanding')}</span><span className={`text-2xl font-extrabold ${owed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatPrice(owed)}</span></p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('finance.dues')}</h2>
        <DataState loading={dues.loading} error={dues.error} empty={!dues.data?.length} onRetry={dues.reload} skeletons={2} skeletonClass="h-12">
          <div className="card overflow-x-auto !p-0">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['finance.period', 'finance.description', 'finance.amount', 'finance.paid', 'finance.dueDate', 'bookings.statusLabel'].map((h) => <th key={h} className="px-4 py-3 font-medium">{t(h)}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dues.data?.map((d) => (
                  <tr key={d.id} className={d.isVoid ? 'opacity-50' : ''}>
                    <td className="px-4 py-3">{d.month}/{d.year}</td>
                    <td className="px-4 py-3">{d.description || t(`finance.types.${d.type}`)}</td>
                    <td className="px-4 py-3">{formatPrice(d.amount)}</td>
                    <td className="px-4 py-3">{formatPrice(d.paidAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(d.dueDate, i18n.language)}</td>
                    <td className="px-4 py-3"><Badge tone={DUE_TONE[d.status]}>{t(`finance.status.${d.status}`)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('finance.paymentHistory')}</h2>
        <DataState loading={payments.loading} error={payments.error} empty={!payments.data?.length} onRetry={payments.reload} skeletons={2} skeletonClass="h-12">
          <div className="card overflow-x-auto !p-0">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{['finance.receipt', 'finance.date', 'finance.amount', 'finance.method', 'bookings.statusLabel'].map((h) => <th key={h} className="px-4 py-3 font-medium">{t(h)}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.data?.map((p) => (
                  <tr key={p.id} className={p.status === 'voided' ? 'opacity-50 line-through' : ''}>
                    <td className="px-4 py-3 font-mono text-xs">{p.receiptNo}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(p.paidAt, i18n.language)}</td>
                    <td className="px-4 py-3">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3">{t(`finance.methods.${p.method}`)}</td>
                    <td className="px-4 py-3">{p.status === 'voided' ? <Badge tone="red">{t('finance.voided')}</Badge> : <Badge tone="green">{t('finance.recorded')}</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </section>
    </div>
  );
}
