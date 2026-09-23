import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './ui/Button.jsx';
import { formatDateTime } from '../utils/format.js';

/** Conversation view + reply box, shared by visitors, signed-in users and staff. */
export default function TicketThread({ ticket, onReply, allowInternal = false }) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const closed = ticket.status === 'closed';

  const send = async () => {
    setBusy(true);
    try { await onReply({ text: text.trim(), internal }); setText(''); setInternal(false); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {ticket.messages.map((m, i) => (
          <li key={i} className={`rounded-xl p-3 text-sm ${m.internal ? 'bg-amber-50 dark:bg-amber-900/20' : m.side === 'staff' ? 'ml-6 bg-primary-50 dark:bg-primary-900/20' : 'mr-6 bg-slate-100 dark:bg-slate-800'}`}>
            <p className="mb-1 text-xs text-slate-500">{m.byName} · {formatDateTime(m.at, i18n.language)}{m.internal && ` · ${t('complaints.internal')}`}</p>
            <p className="whitespace-pre-line">{m.text}</p>
          </li>
        ))}
      </ul>
      {closed ? <p className="text-sm text-slate-500">{t('support.closedNote')}</p> : (
        <div className="space-y-2">
          <textarea className="field" rows={3} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('complaints.replyPlaceholder')} aria-label={t('complaints.replyPlaceholder')} />
          <div className="flex items-center justify-between gap-3">
            {allowInternal ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />{t('complaints.internalOnly')}</label> : <span />}
            <Button disabled={!text.trim()} loading={busy} onClick={send}>{t('complaints.reply')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
