import { useState } from 'react';
import { Facebook, Linkedin, MessageCircle, Share2, Twitter, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { shareLinks } from '../utils/share.js';

export default function ShareMenu({ url, title }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const links = shareLinks(url, title);
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast.success(t('media.copied')); } catch { toast.error(url); } setOpen(false); };

  return (
    <div className="relative inline-block">
      <button className="btn-secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">
        <Share2 size={16} />{t('blog.share')}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <a role="menuitem" href={links.facebook} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Facebook size={16} />Facebook</a>
          <a role="menuitem" href={links.messenger} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><MessageCircle size={16} />Messenger</a>
          <a role="menuitem" href={links.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><MessageCircle size={16} />WhatsApp</a>
          <a role="menuitem" href={links.x} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Twitter size={16} />X</a>
          <a role="menuitem" href={links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Linkedin size={16} />LinkedIn</a>
          <button role="menuitem" onClick={copy} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><LinkIcon size={16} />{t('blog.copyLink')}</button>
        </div>
      )}
    </div>
  );
}
