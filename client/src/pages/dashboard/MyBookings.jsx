import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import BookingStatusBadge from '../../components/BookingStatusBadge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { bookingsApi } from '../../api/rooms.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDate, formatPrice } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const CANCELLABLE = ['pending', 'on_hold', 'approved'];

export default function MyBookings() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => bookingsApi.mine(), []);
  const [toCancel, setToCancel] = useState(null);

  const cancel = async (reason) => {
    try {
      await bookingsApi.cancel(toCancel.id, reason);
      toast.success(t('bookings.cancelled'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('bookings.myTitle')}</h1>
        <Link to="/rooms" className="btn-primary">{t('bookings.browseRooms')}</Link>
      </div>

      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={2} skeletonClass="h-32">
        <ul className="space-y-4">
          {data?.map((b) => (
            <li key={b.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    {b.room ? <Link to={`/rooms/${b.room.id}`} className="hover:underline">{t('rooms.roomN', { n: b.room.roomNumber })}</Link> : '—'}
                    {b.bed && <span className="ml-2 text-sm font-normal text-slate-500">{t('bookings.bed')} {b.bed.label}</span>}
                  </p>
                  <p className="text-sm text-slate-500">{t(`public.hostelType.${b.hostelType}`)} · {formatPrice(b.monthlyRate)} {t('rooms.perBed')}</p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <div><dt className="text-slate-500">{t('bookings.requestedOn')}</dt><dd className="font-medium">{formatDate(b.createdAt, i18n.language)}</dd></div>
                <div><dt className="text-slate-500">{t('bookings.expectedMoveIn')}</dt><dd className="font-medium">{formatDate(b.expectedMoveIn, i18n.language)}</dd></div>
                {b.status === 'pending' && b.holdExpiresAt && <div><dt className="text-slate-500">{t('bookings.holdUntil')}</dt><dd className="font-medium">{formatDate(b.holdExpiresAt, i18n.language)}</dd></div>}
              </dl>
              {b.decisionReason && <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800"><strong>{t('bookings.message')}:</strong> {b.decisionReason}</p>}
              {CANCELLABLE.includes(b.status) && (
                <div className="mt-4 text-right"><button className="btn-secondary" onClick={() => setToCancel(b)}>{t('bookings.cancelRequest')}</button></div>
              )}
            </li>
          ))}
        </ul>
      </DataState>

      <ConfirmDialog open={Boolean(toCancel)} onClose={() => setToCancel(null)} danger withReason title={t('bookings.cancelRequest')} message={t('bookings.cancelConfirm')} confirmLabel={t('bookings.cancelRequest')} onConfirm={cancel} />
    </div>
  );
}
