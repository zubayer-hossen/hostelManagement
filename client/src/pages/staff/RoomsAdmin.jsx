import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import ExportButton from '../../components/ExportButton.jsx';
import DataState from '../../components/DataState.jsx';
import AvailabilityBadge from '../../components/AvailabilityBadge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { roomsApi } from '../../api/rooms.js';
import MediaPicker from '../../components/MediaPicker.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatPrice } from '../../utils/format.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'dormitory'];
const CHECKS = ['hasAC', 'hasWifi', 'hasBalcony', 'hasStudyTable', 'hasWardrobe'];

function F({ register, name, label, type = 'text', ...rest }) {
  return <label className="block"><span className="label">{label}</span><input type={type} className="field" {...register(name)} {...rest} /></label>;
}

function Sel({ register, name, label, options }) {
  return (
    <label className="block"><span className="label">{label}</span>
      <select className="field" {...register(name)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
  );
}

function RoomForm({ room, onClose, onSaved }) {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const editing = Boolean(room);
  const [picking, setPicking] = useState(false);
  const { register, handleSubmit, getValues, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: room
      ? { ...room, sizeSqFt: room.sizeSqFt ?? '', imageUrlsText: (room.imageUrls || []).join('\n'), facilitiesText: (room.facilities || []).join(', ') }
      : { hostelType: 'boys', roomType: 'double', floor: 1, capacity: 2, price: 4000, bathroomType: 'shared', bedType: 'single', status: 'active', hasAC: false, hasWifi: true, hasBalcony: false, hasStudyTable: true, hasWardrobe: true, sizeSqFt: '', description: '', videoUrl: '', imageUrlsText: '', facilitiesText: '' },
  });

  const onSubmit = async (v) => {
    setError(null);
    const body = {
      roomNumber: String(v.roomNumber).trim(), hostelType: v.hostelType, floor: Number(v.floor), roomType: v.roomType,
      capacity: Number(v.capacity), price: Number(v.price), bathroomType: v.bathroomType, bedType: v.bedType, status: v.status,
      description: v.description || '', videoUrl: v.videoUrl || '',
      sizeSqFt: v.sizeSqFt === '' || v.sizeSqFt === null ? null : Number(v.sizeSqFt),
      imageUrls: v.imageUrlsText.split('\n').map((x) => x.trim()).filter(Boolean),
      facilities: v.facilitiesText.split(',').map((x) => x.trim()).filter(Boolean),
      ...Object.fromEntries(CHECKS.map((k) => [k, Boolean(v[k])])),
    };
    try {
      if (editing) await roomsApi.update(room.id, body); else await roomsApi.create(body);
      toast.success(t('staff.roomSaved'));
      onSaved();
      onClose();
    } catch (err) {
      const fields = getFieldErrors(err).map((e) => `${e.field}: ${e.message}`).join(' · ');
      setError(fields || getErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title={editing ? t('staff.editRoom') : t('staff.newRoom')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-3">
          <F register={register} name="roomNumber" label={t('staff.roomNumber')} required maxLength={20} />
          <Sel register={register} name="hostelType" label={t('rooms.hostel')} options={[['boys', t('public.hostelType.boys')], ['girls', t('public.hostelType.girls')]]} />
          <F register={register} name="floor" label={t('rooms.floor')} type="number" min="0" max="50" required />
          <Sel register={register} name="roomType" label={t('rooms.roomType')} options={ROOM_TYPES.map((r) => [r, t(`rooms.types.${r}`)])} />
          <F register={register} name="capacity" label={t('rooms.capacity')} type="number" min="1" max="12" required />
          <F register={register} name="price" label={`${t('rooms.price')} (${t('rooms.perBed')})`} type="number" min="0" required />
          <Sel register={register} name="bathroomType" label={t('rooms.bathroom')} options={[['shared', t('rooms.bathrooms.shared')], ['attached', t('rooms.bathrooms.attached')]]} />
          <Sel register={register} name="bedType" label={t('staff.bedType')} options={[['single', t('staff.bedSingle')], ['bunk', t('staff.bedBunk')]]} />
          <Sel register={register} name="status" label={t('bookings.statusLabel')} options={[['active', t('staff.roomActive')], ['maintenance', t('rooms.availability.maintenance')], ['inactive', t('staff.roomInactive')]]} />
          <F register={register} name="sizeSqFt" label="sq ft" type="number" min="0" />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {CHECKS.map((k) => <label key={k} className="flex items-center gap-2"><input type="checkbox" {...register(k)} />{t(`staff.${k}`)}</label>)}
        </div>
        <label className="block"><span className="label">{t('staff.description')}</span><textarea rows={3} maxLength={2000} className="field" {...register('description')} /></label>
        <label className="block"><span className="label">{t('staff.imageUrls')}</span><textarea rows={3} className="field" placeholder="https://…" {...register('imageUrlsText')} /></label>
        <div><button type="button" className="btn-secondary" onClick={() => setPicking(true)}>{t('media.choose')}</button></div>
        <MediaPicker open={picking} onClose={() => setPicking(false)} purpose="room" onPick={(url) => setValue('imageUrlsText', [getValues('imageUrlsText'), url].filter(Boolean).join('\n'), { shouldDirty: true })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <F register={register} name="videoUrl" label={t('staff.videoUrl')} />
          <F register={register} name="facilitiesText" label={t('staff.extraFacilities')} placeholder="Study table, Wardrobe" />
        </div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" loading={isSubmitting}>{t('common.save')}</Button></div>
      </form>
    </Modal>
  );
}

const BED_TONE = { available: 'green', reserved: 'amber', occupied: 'red', maintenance: 'slate' };

function BedsModal({ room, onClose, onChanged }) {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => roomsApi.adminGet(room.id), [room.id]);

  const toggle = async (bed) => {
    try {
      await roomsApi.setBedMaintenance(room.id, bed.id, bed.status === 'available');
      toast.success(t('staff.bedUpdated'));
      reload();
      onChanged();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <Modal open onClose={onClose} title={`${t('rooms.roomN', { n: room.roomNumber })} — ${t('rooms.beds_title')}`}>
      <DataState loading={loading} error={error} onRetry={reload} skeletons={2} skeletonClass="h-12">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data?.beds.map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-3">
              <span className="w-8 text-lg font-bold">{b.label}</span>
              <Badge tone={BED_TONE[b.status]}>{t(`staff.bed_${b.status}`)}</Badge>
              <span className="flex-1 truncate text-sm text-slate-500">{b.occupant?.name || ''}</span>
              {['available', 'maintenance'].includes(b.status) && (
                <button className="btn-secondary py-1.5" onClick={() => toggle(b)}>{b.status === 'available' ? t('staff.markMaintenance') : t('staff.markAvailable')}</button>
              )}
            </li>
          ))}
        </ul>
      </DataState>
    </Modal>
  );
}

export default function RoomsAdmin() {
  const { t } = useTranslation();
  const [hostelType, setHostelType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null | 'new' | room
  const [beds, setBeds] = useState(null);
  const [toArchive, setToArchive] = useState(null);
  const q = useDebounce(search);

  const params = { page, limit: 15, ...(hostelType && { hostelType }), ...(q && { q }) };
  const { data, meta, loading, error, reload } = useFetch(() => roomsApi.adminList(params), [JSON.stringify(params)]);

  const archive = async () => {
    try {
      await roomsApi.archive(toArchive.id);
      toast.success(t('staff.roomArchived'));
      reload();
    } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('staff.roomsTitle')}</h1>
        <div className="flex gap-2"><ExportButton type="rooms" params={{ ...(hostelType && { hostelType }) }} /><Button onClick={() => setForm('new')}><Plus size={16} />{t('staff.newRoom')}</Button></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" className="field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('rooms.searchPlaceholder')} aria-label={t('rooms.searchPlaceholder')} />
        </div>
        <select className="field w-auto" value={hostelType} onChange={(e) => { setHostelType(e.target.value); setPage(1); }} aria-label={t('rooms.hostel')}>
          <option value="">{t('public.hostelType.all')}</option>
          <option value="boys">{t('public.hostelType.boys')}</option>
          <option value="girls">{t('public.hostelType.girls')}</option>
        </select>
      </div>

      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={4} skeletonClass="h-16">
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>{['staff.roomNumber', 'rooms.hostel', 'rooms.roomType', 'rooms.price', 'staff.beds', 'bookings.statusLabel', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h && t(h)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">{r.roomNumber}<span className="block text-xs font-normal text-slate-500">{t('rooms.floorN', { n: r.floor })}</span></td>
                  <td className="px-4 py-3">{t(`public.hostelType.${r.hostelType}`)}</td>
                  <td className="px-4 py-3">{t(`rooms.types.${r.roomType}`)}</td>
                  <td className="px-4 py-3">{formatPrice(r.price)}</td>
                  <td className="px-4 py-3">{r.availableBeds} / {r.capacity}</td>
                  <td className="px-4 py-3"><AvailabilityBadge status={r.availabilityStatus} availableBeds={r.availableBeds} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="btn-ghost py-1.5" onClick={() => setBeds(r)}>{t('staff.beds')}</button>
                    <button className="btn-ghost py-1.5" onClick={() => setForm(r)}>{t('staff.edit')}</button>
                    <button className="btn-ghost py-1.5 text-red-600" onClick={() => setToArchive(r)}>{t('staff.archive')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={meta} onPage={setPage} />
      </DataState>

      {form && <RoomForm room={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={reload} />}
      {beds && <BedsModal room={beds} onClose={() => setBeds(null)} onChanged={reload} />}
      <ConfirmDialog open={Boolean(toArchive)} onClose={() => setToArchive(null)} danger title={t('staff.archive')} message={t('staff.archiveConfirm', { n: toArchive?.roomNumber })} confirmLabel={t('staff.archive')} onConfirm={archive} />
    </div>
  );
}
