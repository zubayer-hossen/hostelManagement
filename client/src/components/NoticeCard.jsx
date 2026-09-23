import { Paperclip, Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from './ui/Badge.jsx';
import { formatDate } from '../utils/format.js';

const TONE = { normal: 'slate', important: 'amber', urgent: 'red' };

export default function NoticeCard({ notice }) {
  const { t, i18n } = useTranslation();
  return (
    <article className="card h-full">
      <div className="flex flex-wrap items-center gap-2">
        {notice.isPinned && <Badge tone="primary"><Pin size={12} className="mr-1" />{t('public.notices.pinned')}</Badge>}
        <Badge tone={TONE[notice.priority]}>{t(`public.notices.${notice.priority}`)}</Badge>
        <time className="text-xs text-slate-500" dateTime={notice.publishAt}>{formatDate(notice.publishAt, i18n.language)}</time>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{notice.title}</h3>
      {notice.imageUrl && <img src={notice.imageUrl} alt="" loading="lazy" className="mt-3 max-h-56 w-full rounded-lg object-cover" />}
      {notice.body && <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{notice.body}</p>}
      {notice.attachmentUrl && (
        <a href={notice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline">
          <Paperclip size={14} /> {t('public.notices.attachment')}
        </a>
      )}
    </article>
  );
}
