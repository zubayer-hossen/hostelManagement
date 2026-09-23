import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/PageHeader.jsx';
import DataState from '../../components/DataState.jsx';
import RoomCard from '../../components/RoomCard.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { roomsApi } from '../../api/rooms.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const FILTER_KEYS = ['q', 'hostelType', 'roomType', 'minPrice', 'maxPrice', 'ac', 'attachedBathroom', 'availability', 'floor', 'capacity', 'sort', 'page'];
const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'dormitory'];

function Select({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </label>
  );
}

/** Room marketplace. All filters live in the URL, so a filtered list can be shared or bookmarked. */
export default function RoomsPage() {
  const { t } = useTranslation();
  usePageTitle(t('rooms.title'));
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const { ids, setFavorite } = useFavorites();

  const get = (k) => params.get(k) || '';
  const update = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === '' || v === null || v === false) next.delete(k); else next.set(k, String(v));
      }
      if (!('page' in patch)) next.delete('page');
      return next;
    }, { replace: true });

  // debounced free-text search
  const [search, setSearch] = useState(get('q'));
  const debounced = useDebounce(search);
  useEffect(() => { if (debounced !== get('q')) update({ q: debounced }); /* eslint-disable-next-line */ }, [debounced]);

  const query = useMemo(() => {
    const q = { limit: 12 };
    for (const k of FILTER_KEYS) if (params.get(k)) q[k] = params.get(k);
    return q;
  }, [params]);

  const { data, meta, loading, error, reload } = useFetch(() => roomsApi.list(query), [JSON.stringify(query)]);
  const activeCount = FILTER_KEYS.filter((k) => !['q', 'sort', 'page'].includes(k) && params.get(k)).length;
  const clear = () => { setSearch(''); setParams({}, { replace: true }); };

  return (
    <>
      <PageHeader title={t('rooms.title')} subtitle={t('rooms.subtitle')} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('rooms.searchPlaceholder')} aria-label={t('rooms.searchPlaceholder')} className="field pl-10" />
          </div>
          <select aria-label={t('rooms.sort.label')} className="field w-auto" value={get('sort')} onChange={(e) => update({ sort: e.target.value })}>
            <option value="">{t('rooms.sort.roomNumber')}</option>
            <option value="price">{t('rooms.sort.priceAsc')}</option>
            <option value="-price">{t('rooms.sort.priceDesc')}</option>
            <option value="capacity">{t('rooms.sort.capacity')}</option>
            <option value="newest">{t('rooms.sort.newest')}</option>
          </select>
          <button className="btn-secondary" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal size={16} />{t('rooms.filters')}{activeCount > 0 && <span className="rounded-full bg-primary-600 px-1.5 text-xs text-white">{activeCount}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="card mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select label={t('rooms.hostel')} value={get('hostelType')} onChange={(v) => update({ hostelType: v })}>
              <option value="">{t('public.hostelType.all')}</option>
              <option value="boys">{t('public.hostelType.boys')}</option>
              <option value="girls">{t('public.hostelType.girls')}</option>
            </Select>
            <Select label={t('rooms.roomType')} value={get('roomType')} onChange={(v) => update({ roomType: v })}>
              <option value="">{t('public.hostelType.all')}</option>
              {ROOM_TYPES.map((r) => <option key={r} value={r}>{t(`rooms.types.${r}`)}</option>)}
            </Select>
            <label className="block"><span className="label">{t('rooms.minPrice')}</span><input type="number" min="0" className="field" defaultValue={get('minPrice')} key={`min-${get('minPrice')}`} onBlur={(e) => update({ minPrice: e.target.value })} /></label>
            <label className="block"><span className="label">{t('rooms.maxPrice')}</span><input type="number" min="0" className="field" defaultValue={get('maxPrice')} key={`max-${get('maxPrice')}`} onBlur={(e) => update({ maxPrice: e.target.value })} /></label>
            <Select label={t('rooms.capacity')} value={get('capacity')} onChange={(v) => update({ capacity: v })}>
              <option value="">{t('public.hostelType.all')}</option>
              {[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{t('rooms.beds', { count: n })}</option>)}
            </Select>
            <Select label={t('rooms.floor')} value={get('floor')} onChange={(v) => update({ floor: v })}>
              <option value="">{t('public.hostelType.all')}</option>
              {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{t('rooms.floorN', { n })}</option>)}
            </Select>
            <div className="flex flex-col justify-end gap-2 text-sm sm:col-span-2 lg:col-span-2">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={get('ac') === 'true'} onChange={(e) => update({ ac: e.target.checked ? 'true' : '' })} />{t('rooms.acOnly')}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={get('attachedBathroom') === 'true'} onChange={(e) => update({ attachedBathroom: e.target.checked ? 'true' : '' })} />{t('rooms.attached')}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={get('availability') === 'available'} onChange={(e) => update({ availability: e.target.checked ? 'available' : '' })} />{t('rooms.onlyAvailable')}</label>
              </div>
            </div>
            <div className="flex items-end justify-end sm:col-span-2 lg:col-span-4">
              <button className="btn-ghost" onClick={clear}><X size={16} />{t('rooms.clearFilters')}</button>
            </div>
          </div>
        )}

        <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={6} skeletonClass="h-72">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((room, i) => <RoomCard key={room.id} room={room} index={i} favorite={ids.has(room.id)} onFavoriteChange={(on) => setFavorite(room.id, on)} />)}
          </div>
          <Pagination meta={meta} onPage={(p) => update({ page: p })} />
        </DataState>
      </div>
    </>
  );
}
