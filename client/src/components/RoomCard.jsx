import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bath, BedDouble, Snowflake, Users, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AvailabilityBadge from './AvailabilityBadge.jsx';
import FavoriteButton from './FavoriteButton.jsx';
import { formatPrice } from '../utils/format.js';

/** Marketplace-style room card. */
export default function RoomCard({ room, index = 0, favorite, onFavoriteChange }) {
  const { t } = useTranslation();
  const unavailable = ['fully_booked', 'maintenance', 'inactive'].includes(room.availabilityStatus);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.04 }}
      whileHover={{ y: -4 }}
      className="card group relative flex h-full flex-col overflow-hidden !p-0 transition-shadow hover:shadow-glow"
    >
      <Link to={`/rooms/${room.id}`} className="flex flex-1 flex-col" aria-label={t('rooms.roomN', { n: room.roomNumber })}>
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-500/80 to-secondary-500/80">
          {room.imageUrls?.[0]
            ? <img src={room.imageUrls[0]} alt="" loading="lazy" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${unavailable ? 'grayscale-[60%]' : ''}`} />
            : <div className="grid h-full place-items-center text-white/80"><BedDouble size={44} /></div>}
          <AvailabilityBadge status={room.availabilityStatus} availableBeds={room.availableBeds} className="absolute left-3 top-3 shadow" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">{t('rooms.roomN', { n: room.roomNumber })}</h3>
              <p className="text-xs text-slate-500">{t(`public.hostelType.${room.hostelType}`)} · {t('rooms.floorN', { n: room.floor })} · {t(`rooms.types.${room.roomType}`)}</p>
            </div>
            <p className="text-right"><span className="text-lg font-bold text-primary-600">{formatPrice(room.price)}</span><span className="block text-[11px] text-slate-500">{t('rooms.perBed')}</span></p>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-1"><Users size={14} />{t('rooms.beds', { count: room.capacity })}</li>
            {room.hasAC && <li className="flex items-center gap-1"><Snowflake size={14} />AC</li>}
            {room.bathroomType === 'attached' && <li className="flex items-center gap-1"><Bath size={14} />{t('rooms.attached')}</li>}
            {room.hasWifi && <li className="flex items-center gap-1"><Wifi size={14} />Wi-Fi</li>}
          </ul>
          <p className="mt-auto pt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            {room.availableBeds > 0 ? t('rooms.freeBeds', { free: room.availableBeds, total: room.capacity }) : t('rooms.noFreeBeds')}
          </p>
        </div>
      </Link>
      <FavoriteButton roomId={room.id} active={Boolean(favorite)} onChange={onFavoriteChange} className="absolute right-3 top-3" />
    </motion.article>
  );
}
