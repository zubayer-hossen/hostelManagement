import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationsApi } from '../api/residents.js';
import { formatDateTime } from '../utils/format.js';

const POLL_MS = 60 * 1000; // real-time push (Socket.IO) replaces polling in Phase 6

export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 8 });
      setItems(res.data);
      setUnread(res.meta.unreadCount);
    } catch { /* keep the previous list; the bell is non-critical */ }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const openItem = async (n) => {
    if (!n.readAt) { try { await notificationsApi.read(n.id); } catch { /* ignore */ } }
    setOpen(false);
    load();
    if (n.link) navigate(n.link);
  };
  const readAll = async () => { try { await notificationsApi.readAll(); } finally { load(); } };

  return (
    <div className="relative" ref={box}>
      <button className="btn-ghost relative p-2" onClick={() => { setOpen((o) => !o); if (!open) load(); }} aria-expanded={open} aria-label={t('notifications.title', { count: unread })}>
        <Bell size={20} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label={t('notifications.heading')} className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="font-semibold">{t('notifications.heading')}</p>
            {unread > 0 && <button onClick={readAll} className="text-xs font-semibold text-primary-600 hover:underline">{t('notifications.markAll')}</button>}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="p-6 text-center text-sm text-slate-500">{t('notifications.empty')}</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => openItem(n)} className={`w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${n.readAt ? '' : 'bg-primary-50/60 dark:bg-primary-900/20'}`}>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.createdAt, i18n.language)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
