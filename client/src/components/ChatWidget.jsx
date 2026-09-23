import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { chatbotApi } from '../api/chatbot.js';
import { useSettings } from '../context/SettingsContext.jsx';

/**
 * Floating 24/7 assistant. Answers only from published hostel content (rooms, prices, facilities, food, rules,
 * contact, FAQ). It never claims to book, pay or change anything, and hands off to Support/Meetings when it
 * cannot help — see server/src/services/chatbot for the knowledge and the hand-off wording.
 */
export default function ChatWidget() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [{ from: 'bot', text: null, links: [] }]); // text: null -> greeting rendered from i18n
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setInput(''); setBusy(true);
    try {
      const res = await chatbotApi.ask(text);
      setMessages((m) => [...m, { from: 'bot', text: res.data.reply, links: res.data.links || [] }]);
    } catch {
      setMessages((m) => [...m, { from: 'bot', text: t('chatbot.error'), links: [] }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <div role="dialog" aria-label={t('chatbot.title')} className="mb-3 flex h-[28rem] w-[22rem] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between bg-primary-600 px-4 py-3 text-white">
            <p className="font-semibold">{t('chatbot.title')}</p>
            <button onClick={() => setOpen(false)} aria-label={t('common.close')} className="rounded-full p-1 hover:bg-white/20"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.from === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {m.text ?? t('chatbot.greeting', { hostelName: settings.general.hostelName })}
                  {m.links?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.links.map((l) => <Link key={l.path} to={l.path} onClick={() => setOpen(false)} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary-700 shadow dark:bg-slate-700 dark:text-primary-300">{l.label}</Link>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400 dark:bg-slate-800">{t('chatbot.typing')}</div></div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-2 dark:border-slate-800">
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder={t('chatbot.placeholder')} aria-label={t('chatbot.placeholder')} className="field" />
            <button type="submit" disabled={!input.trim() || busy} aria-label={t('chatbot.send')} className="btn-primary p-2.5"><Send size={16} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label={t('chatbot.toggle')} className="grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-white shadow-glow transition hover:scale-105">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
