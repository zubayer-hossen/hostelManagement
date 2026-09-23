import { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Full-screen image viewer: Esc closes, ← → navigate, focus is moved into the dialog. */
export default function Lightbox({ items, index, onClose, onChange }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  const item = items[index];
  const go = useCallback((d) => onChange((index + d + items.length) % items.length), [index, items.length, onChange]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [go, onClose]);

  if (!item) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={item.title || t('public.gallery.preview')} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4">
      <button ref={closeRef} onClick={onClose} aria-label={t('common.close')} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={22} /></button>
      {items.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label={t('common.previous')} className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft size={26} /></button>
          <button onClick={() => go(1)} aria-label={t('common.next')} className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight size={26} /></button>
        </>
      )}
      <figure className="max-h-full max-w-5xl text-center">
        <img src={item.imageUrl} alt={item.title || item.category} className="mx-auto max-h-[80vh] rounded-lg object-contain" />
        {(item.title || item.description) && (
          <figcaption className="mt-3 text-white">
            {item.title && <p className="font-semibold">{item.title}</p>}
            {item.description && <p className="text-sm text-white/70">{item.description}</p>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
