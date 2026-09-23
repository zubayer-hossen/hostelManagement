import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import RichText from '../components/RichText.jsx';
import DataState from '../components/DataState.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import FacilityCard from '../components/FacilityCard.jsx';
import FoodMenuBoard from '../components/FoodMenuBoard.jsx';
import NoticeCard from '../components/NoticeCard.jsx';
import RoomCard from '../components/RoomCard.jsx';
import { roomsApi } from '../api/rooms.js';
import { formatPrice } from '../utils/format.js';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

/** Boys / Girls hostel portal: intro text, facilities, weekly food menu and notices for that hostel. */
export default function HostelPortal({ type }) {
  const { t } = useTranslation();
  const page = useFetch(() => contentApi.page(type), [type]);
  const facilities = useFetch(() => contentApi.facilities({ hostelType: type }), [type]);
  const menu = useFetch(() => contentApi.foodMenu({ hostelType: type }), [type]);
  const stats = useFetch(() => roomsApi.stats(), []);
  const roomList = useFetch(() => roomsApi.list({ hostelType: type, availability: 'available', sort: 'price', limit: 3 }), [type]);
  const notices = useFetch(() => contentApi.notices({ audience: type, limit: 3 }), [type]);

  const title = page.data?.title || t(`public.portal.${type}`);
  usePageTitle(title);

  return (
    <>
      <PageHeader title={title} subtitle={t(`public.portal.${type}Subtitle`)} />

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6">
        {page.data && <article className="card max-w-3xl"><RichText content={page.data.content} /></article>}

        {stats.data && stats.data[type].rooms > 0 && (
          <section aria-label={t('rooms.title')} className="grid gap-4 sm:grid-cols-3">
            <div className="card text-center"><p className="text-3xl font-extrabold text-primary-600">{stats.data[type].availableBeds}</p><p className="text-sm text-slate-500">{t('rooms.availableBeds')}</p></div>
            <div className="card text-center"><p className="text-3xl font-extrabold text-primary-600">{stats.data[type].rooms}</p><p className="text-sm text-slate-500">{t('rooms.roomsCount')}</p></div>
            <div className="card text-center"><p className="text-3xl font-extrabold text-primary-600">{formatPrice(stats.data[type].minPrice)}</p><p className="text-sm text-slate-500">{t('rooms.startingFrom')}</p></div>
          </section>
        )}

        {roomList.data?.length > 0 && (
          <section>
            <SectionHeading title={t('rooms.availableRooms')} to={`/rooms?hostelType=${type}`} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{roomList.data.map((r, i) => <RoomCard key={r.id} room={r} index={i} />)}</div>
          </section>
        )}

        <section>
          <SectionHeading title={t('public.facilities.title')} />
          <DataState loading={facilities.loading} error={facilities.error} empty={!facilities.data?.length} onRetry={facilities.reload} skeletons={3}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{facilities.data?.map((f, i) => <FacilityCard key={f.id} facility={f} index={i} />)}</div>
          </DataState>
        </section>

        <section>
          <SectionHeading title={t('public.food.title')} to="/food-menu" />
          <DataState loading={menu.loading} error={menu.error} empty={!menu.data?.length} onRetry={menu.reload} skeletons={4} skeletonClass="h-40">
            {menu.data && <FoodMenuBoard menu={menu.data} hostelType={type} />}
          </DataState>
        </section>

        {notices.data?.length > 0 && (
          <section>
            <SectionHeading title={t('public.notices.title')} to="/notices" />
            <div className="grid gap-5 md:grid-cols-3">{notices.data.map((n) => <NoticeCard key={n.id} notice={n} />)}</div>
          </section>
        )}

        <section className="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">{t('public.portal.reserveTitle')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('public.portal.reserveText')}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/rooms" className="btn-primary">{t('rooms.title')}</Link>
            <Link to="/contact" className="btn-secondary">{t('public.portal.contactUs')}</Link>
            <Link to="/rules" className="btn-secondary">{t('public.footer.rules')}</Link>
          </div>
        </section>
      </div>
    </>
  );
}
