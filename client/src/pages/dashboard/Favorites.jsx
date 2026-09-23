import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataState from '../../components/DataState.jsx';
import RoomCard from '../../components/RoomCard.jsx';
import { roomsApi } from '../../api/rooms.js';
import { useFetch } from '../../hooks/useFetch.js';

export default function Favorites() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => roomsApi.favorites(), []);
  const [removed, setRemoved] = useState(() => new Set());
  const rooms = (data || []).filter((r) => !removed.has(r.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('rooms.favorites')}</h1>
      <DataState loading={loading} error={error} empty={!rooms.length} onRetry={reload} skeletons={3} skeletonClass="h-72">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((r, i) => <RoomCard key={r.id} room={r} index={i} favorite onFavoriteChange={(on) => { if (!on) setRemoved((s) => new Set(s).add(r.id)); }} />)}
        </div>
      </DataState>
    </div>
  );
}
