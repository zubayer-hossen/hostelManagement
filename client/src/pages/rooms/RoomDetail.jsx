import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bath, Check, Snowflake, Sun, Table2, Wifi, Shirt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AvailabilityBadge from '../../components/AvailabilityBadge.jsx';
import FavoriteButton from '../../components/FavoriteButton.jsx';
import DataState from '../../components/DataState.jsx';
import { roomsApi } from '../../api/rooms.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { formatPrice } from '../../utils/format.js';

const BED_STYLE = {
  available: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  booked: 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300',
  maintenance: 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800',
};

export default function RoomDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: room, loading, error, notFound, reload } = useFetch(() => roomsApi.get(id), [id]);
  const { ids, setFavorite } = useFavorites();
  const [imgIndex, setImgIndex] = useState(0);
  usePageTitle(room ? t('rooms.roomN', { n: room.roomNumber }) : t('rooms.title'));

  const canBook = room && room.status === 'active' && room.availableBeds > 0;
  const yn = (v) => (v ? t('common.yes') : t('common.no'));
  const specs = room && [
    [Bath, t('rooms.bathroom'), t(`rooms.bathrooms.${room.bathroomType}`)],
    [Snowflake, t('rooms.cooling'), room.hasAC ? 'AC' : t('rooms.fan')],
    [Wifi, 'Wi-Fi', yn(room.hasWifi)],
    [Sun, t('rooms.balcony'), yn(room.hasBalcony)],
    [Table2, t('rooms.studyTable'), yn(room.hasStudyTable)],
    [Shirt, t('rooms.wardrobe'), yn(room.hasWardrobe)],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/rooms" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"><ArrowLeft size={16} />{t('rooms.backToRooms')}</Link>
      <DataState loading={loading} error={error} empty={notFound} onRetry={reload} skeletons={1} skeletonClass="h-96">
        {room && (
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500/80 to-secondary-500/80">
                {room.imageUrls?.length
                  ? <img src={room.imageUrls[imgIndex]} alt={t('rooms.roomN', { n: room.roomNumber })} className="h-72 w-full object-cover sm:h-[26rem]" />
                  : <div className="grid h-72 place-items-center text-white/80 sm:h-[26rem]">{t('rooms.noPhotos')}</div>}
                <AvailabilityBadge status={room.availabilityStatus} availableBeds={room.availableBeds} className="absolute left-4 top-4 shadow" />
                <FavoriteButton roomId={room.id} active={ids.has(room.id)} onChange={(on) => setFavorite(room.id, on)} className="absolute right-4 top-4" />
              </div>
              {room.imageUrls?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {room.imageUrls.map((u, i) => (
                    <button key={u} onClick={() => setImgIndex(i)} aria-label={`${i + 1}`} aria-current={i === imgIndex} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === imgIndex ? 'border-primary-600' : 'border-transparent'}`}>
                      <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {room.videoUrl && <video src={room.videoUrl} controls preload="none" className="w-full rounded-2xl" />}
              {room.description && <div className="card"><h2 className="text-lg font-semibold">{t('rooms.about')}</h2><p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">{room.description}</p></div>}
            </div>

            <aside className="space-y-5 lg:col-span-2">
              <div className="card">
                <p className="text-sm text-slate-500">{t(`public.hostelType.${room.hostelType}`)} · {t('rooms.floorN', { n: room.floor })} · {t(`rooms.types.${room.roomType}`)}</p>
                <h1 className="mt-1 text-3xl font-extrabold">{t('rooms.roomN', { n: room.roomNumber })}</h1>
                <p className="mt-3"><span className="text-3xl font-bold text-primary-600">{formatPrice(room.price)}</span> <span className="text-sm text-slate-500">{t('rooms.perBed')}</span></p>
                {room.sizeSqFt && <p className="mt-1 text-sm text-slate-500">{room.sizeSqFt} sq ft</p>}

                <div className="mt-5">
                  {canBook
                    ? <Link to={`/rooms/${room.id}/book`} className="btn-primary w-full py-3">{t('rooms.requestRoom')}</Link>
                    : <button className="btn-secondary w-full py-3" disabled>{room.availabilityStatus === 'fully_booked' ? t('rooms.availability.fully_booked') : t('rooms.notBookable')}</button>}
                  <p className="mt-2 text-center text-xs text-slate-500">{t('rooms.requestNote')}</p>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold">{t('rooms.beds_title')}</h2>
                <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6">
                  {room.beds.map((b) => (
                    <li key={b.label} className={`rounded-lg border p-2 text-center text-sm font-semibold ${BED_STYLE[b.status]}`}>
                      {b.label}<span className="block text-[10px] font-normal uppercase">{t(`rooms.bedStatus.${b.status}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold">{t('rooms.features')}</h2>
                <ul className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {specs.map(([Icon, label, value]) => (
                    <li key={label} className="flex items-center gap-2"><Icon size={16} className="text-primary-600" /><span className="text-slate-500">{label}:</span><span className="font-medium">{value}</span></li>
                  ))}
                </ul>
                {room.facilities?.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                    {room.facilities.map((f) => <li key={f} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800"><Check size={12} />{f}</li>)}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        )}
      </DataState>
    </div>
  );
}
