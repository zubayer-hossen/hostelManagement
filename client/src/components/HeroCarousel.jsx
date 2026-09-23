import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import SmartLink from './SmartLink.jsx';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Admin-managed hero banners. With none configured it falls back to a hero built from the site settings. */
export default function HeroCarousel() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();
  const { data, loading } = useFetch(() => contentApi.banners(), []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const banners = data?.length
    ? data
    : [{
        id: 'fallback',
        title: settings.general.hostelName,
        subtitle: settings.general.tagline || t('home.defaultTagline'),
        description: settings.general.description,
        ctaText: isAuthenticated ? t('common.dashboard') : t('home.getStarted'),
        ctaLink: isAuthenticated ? '/dashboard' : '/register',
        secondaryCtaText: isAuthenticated ? '' : t('common.login'),
        secondaryCtaLink: '/login',
      }];

  useEffect(() => { if (index >= banners.length) setIndex(0); }, [banners.length, index]);

  useEffect(() => {
    if (banners.length < 2 || paused || prefersReducedMotion() || settings.theme.animations === false) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6500);
    return () => clearInterval(id);
  }, [banners.length, paused, settings.theme.animations]);

  const b = banners[Math.min(index, banners.length - 1)];
  const go = (d) => setIndex((i) => (i + d + banners.length) % banners.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('public.hero')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative isolate min-h-[26rem] overflow-hidden bg-slate-900 text-white sm:min-h-[32rem]"
    >
      {/* background */}
      <AnimatePresence mode="wait">
        <motion.div key={`bg-${b.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 -z-10">
          {b.videoUrl ? (
            <video src={b.videoUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline poster={b.imageUrl || undefined} />
          ) : b.imageUrl ? (
            <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/20" />
        </motion.div>
      </AnimatePresence>

      <div className="mx-auto flex min-h-[26rem] max-w-7xl items-center px-4 py-16 sm:min-h-[32rem] sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div key={`txt-${b.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="max-w-2xl" aria-live="polite">
            {b.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-white/80">{b.subtitle}</p>}
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white drop-shadow sm:text-6xl">{b.title}</h1>
            {b.description && <p className="mt-4 max-w-xl text-lg text-white/85">{b.description}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {b.ctaText && b.ctaLink && <SmartLink to={b.ctaLink} className="btn bg-white px-6 py-3 text-primary-700 hover:bg-primary-50">{b.ctaText}</SmartLink>}
              {b.secondaryCtaText && b.secondaryCtaLink && <SmartLink to={b.secondaryCtaLink} className="btn border border-white/60 px-6 py-3 text-white hover:bg-white/10">{b.secondaryCtaText}</SmartLink>}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {banners.length > 1 && !loading && (
        <>
          <button onClick={() => go(-1)} aria-label={t('common.previous')} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/30 sm:block"><ChevronLeft /></button>
          <button onClick={() => go(1)} aria-label={t('common.next')} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/30 sm:block"><ChevronRight /></button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((x, i) => (
              <button key={x.id} onClick={() => setIndex(i)} aria-label={`${i + 1} / ${banners.length}`} aria-current={i === index} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
