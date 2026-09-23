import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Phone } from 'lucide-react';
import VisitorBadge from '../components/VisitorBadge.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import HeadlineTicker from '../components/HeadlineTicker.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import DataState from '../components/DataState.jsx';
import FacilityCard from '../components/FacilityCard.jsx';
import NoticeCard from '../components/NoticeCard.jsx';
import Accordion from '../components/Accordion.jsx';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { DEFAULT_HOME_SECTIONS } from '../constants/site.js';
import { telHref } from '../utils/links.js';

const Wrap = ({ children, tone }) => (
  <section className={tone === 'alt' ? 'bg-white py-14 dark:bg-slate-900/50' : 'py-14'}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
  </section>
);

function FacilitiesSection() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => contentApi.facilities({ limit: 6 }), []);
  if (!loading && !error && !data?.length) return null;
  return (
    <Wrap>
      <SectionHeading title={t('public.facilities.title')} subtitle={t('public.facilities.subtitle')} to="/facilities" />
      <DataState loading={loading} error={error} onRetry={reload} skeletons={6} skeletonClass="h-44">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.map((f, i) => <FacilityCard key={f.id} facility={f} index={i} />)}</div>
      </DataState>
    </Wrap>
  );
}

function NoticesSection() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => contentApi.notices({ limit: 3 }), []);
  if (!loading && !error && !data?.length) return null;
  return (
    <Wrap tone="alt">
      <SectionHeading title={t('public.notices.title')} to="/notices" />
      <DataState loading={loading} error={error} onRetry={reload}>
        <div className="grid gap-5 md:grid-cols-3">{data?.map((n) => <NoticeCard key={n.id} notice={n} />)}</div>
      </DataState>
    </Wrap>
  );
}

function FaqSection() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => contentApi.faqs({ featured: 'true', limit: 6 }), []);
  if (!loading && !error && !data?.length) return null;
  return (
    <Wrap>
      <SectionHeading title={t('public.faq.title')} to="/faq" />
      <div className="mx-auto max-w-3xl">
        <DataState loading={loading} error={error} onRetry={reload} skeletons={3} skeletonClass="h-16">
          {data && <Accordion items={data} />}
        </DataState>
      </div>
    </Wrap>
  );
}

function ContactSection() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { address } = settings.general;
  const { phone, email } = settings.contact;
  if (!address && !phone && !email) return null;
  return (
    <Wrap tone="alt">
      <SectionHeading title={t('home.contactTitle')} to="/contact" />
      <ul className="grid gap-4 text-sm sm:grid-cols-3">
        {address && <li className="card flex items-start gap-3"><MapPin className="mt-0.5 shrink-0 text-primary-600" size={18} /><span>{address}</span></li>}
        {phone && <li className="card flex items-center gap-3"><Phone className="text-primary-600" size={18} /><a href={telHref(phone)} className="hover:underline">{phone}</a></li>}
        {email && <li className="card flex items-center gap-3"><Mail className="text-primary-600" size={18} /><a href={`mailto:${email}`} className="break-all hover:underline">{email}</a></li>}
      </ul>
    </Wrap>
  );
}

const SECTIONS = { hero: HeroCarousel, headlines: HeadlineTicker, facilities: FacilitiesSection, notices: NoticesSection, faq: FaqSection, contact: ContactSection };

/** Homepage: sections, their order and visibility come from Admin → Settings → Home sections. */
export default function Home() {
  const { settings } = useSettings();
  usePageTitle('');
  const sections = useMemo(
    () => (settings.homeSections?.length ? settings.homeSections : DEFAULT_HOME_SECTIONS).filter((s) => s.enabled && SECTIONS[s.key]),
    [settings.homeSections]
  );
  return <>{sections.map((s) => { const C = SECTIONS[s.key]; return <C key={s.key} />; })}<VisitorBadge /></>;
}
