import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader.jsx';
import DataState from '../../components/DataState.jsx';
import AvailabilityBadge from '../../components/AvailabilityBadge.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { roomsApi, bookingsApi } from '../../api/rooms.js';
import { useFetch } from '../../hooks/useFetch.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { bookingSchema } from '../../validations/booking.js';
import { getErrorMessage } from '../../utils/errors.js';
import { formatPrice } from '../../utils/format.js';

function Form({ room }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const requiredGender = room.hostelType === 'boys' ? 'male' : 'female';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { fullName: user.name, phone: user.phone || '', email: user.email, gender: requiredGender, occupation: '', institution: '', expectedMoveIn: '', notes: '' },
  });

  const onSubmit = async (values) => {
    setError(null);
    try {
      const body = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
      await bookingsApi.create({ ...body, roomId: room.id });
      toast.success(t('bookings.submitted'));
      navigate('/dashboard/bookings', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('errors.generic')));
    }
  };

  const minDate = new Date().toISOString().slice(0, 10);
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('common.name')} error={errors.fullName?.message} {...register('fullName')} />
        <Input label={t('common.phone')} type="tel" error={errors.phone?.message} {...register('phone')} />
        <Input label={t('common.email')} type="email" error={errors.email?.message} {...register('email')} />
        <label className="block">
          <span className="label">{t('bookings.gender')}</span>
          <select className="field" {...register('gender')}>
            <option value="male">{t('bookings.male')}</option>
            <option value="female">{t('bookings.female')}</option>
          </select>
        </label>
        <Input label={t('bookings.occupation')} optional error={errors.occupation?.message} {...register('occupation')} />
        <Input label={t('bookings.institution')} optional error={errors.institution?.message} {...register('institution')} />
        <Input label={t('bookings.expectedMoveIn')} type="date" min={minDate} error={errors.expectedMoveIn?.message} {...register('expectedMoveIn')} />
      </div>
      <div>
        <label htmlFor="notes" className="label">{t('bookings.notes')} <span className="font-normal text-slate-400">({t('common.optional')})</span></label>
        <textarea id="notes" rows={3} maxLength={500} className="field" {...register('notes')} />
      </div>
      <p className="text-xs text-slate-500">{t('bookings.holdNote')}</p>
      <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">{t('bookings.submit')}</Button>
    </form>
  );
}

export default function BookRoom() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: room, loading, error, notFound, reload } = useFetch(() => roomsApi.get(id), [id]);
  usePageTitle(t('bookings.requestTitle'));
  const bookable = room && room.status === 'active' && room.availableBeds > 0;

  return (
    <>
      <PageHeader title={t('bookings.requestTitle')} subtitle={room ? `${t('rooms.roomN', { n: room.roomNumber })} · ${t(`public.hostelType.${room.hostelType}`)}` : undefined} />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <DataState loading={loading} error={error} empty={notFound} onRetry={reload} skeletons={1} skeletonClass="h-80">
          {room && (
            <>
              <div className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{t('rooms.roomN', { n: room.roomNumber })} · {t(`rooms.types.${room.roomType}`)}</p>
                  <p className="text-sm text-slate-500">{formatPrice(room.price)} {t('rooms.perBed')}</p>
                </div>
                <AvailabilityBadge status={room.availabilityStatus} availableBeds={room.availableBeds} />
              </div>
              {bookable
                ? <Form room={room} />
                : <Alert tone="error">{t('rooms.notBookable')} <Link to="/rooms" className="font-semibold underline">{t('rooms.backToRooms')}</Link></Alert>}
            </>
          )}
        </DataState>
      </div>
    </>
  );
}
