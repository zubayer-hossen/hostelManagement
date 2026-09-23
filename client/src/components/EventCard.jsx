import { CalendarDays, ExternalLink, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from './ui/Badge.jsx';
import { formatDateTime } from '../utils/format.js';
import { isExternal } from '../utils/links.js';

export default function EventCard({ event }) {
  const { t, i18n } = useTranslation();
  const cancelled = event.status === 'cancelled';
  return (
    <article className={`card flex h-full flex-col overflow-hidden !p-0 ${cancelled ? 'opacity-70' : ''}`}>
      {event.imageUrl && <img src={event.imageUrl} alt="" loading="lazy" className="h-40 w-full object-cover" />}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={cancelled ? 'red' : event.status === 'completed' ? 'slate' : 'primary'}>{t(`cms.eventStatus.${event.status}`)}</Badge>
        </div>
        <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2"><CalendarDays size={15} className="text-primary-600" />{formatDateTime(event.startsAt, i18n.language)}</li>
          {event.location && <li className="flex items-center gap-2"><MapPin size={15} className="text-primary-600" />{event.location}</li>}
          {event.organizer && <li className="flex items-center gap-2"><User size={15} className="text-primary-600" />{event.organizer}</li>}
        </ul>
        {event.description && <p className="mt-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{event.description}</p>}
        {event.registrationLink && !cancelled && event.status !== 'completed' && (
          <a href={event.registrationLink} {...(isExternal(event.registrationLink) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="btn-primary mt-auto self-start">
            {t('public.events.register')} <ExternalLink size={14} />
          </a>
        )}
      </div>
    </article>
  );
}
