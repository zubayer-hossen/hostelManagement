import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DataState from '../../components/DataState.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import TicketThread from '../../components/TicketThread.jsx';
import { supportApi, TICKET_STATUS_TONE } from '../../api/support.js';
import { useFetch } from '../../hooks/useFetch.js';
import { formatDateTime } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

function Detail({ id, onClose, onChanged }) {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => supportApi.mineOne(id), [id]);
  const reply = async ({ text }) => {
    try { await supportApi.mineReply(id, text); reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };
  return (
    <Modal open onClose={onClose} title={data ? `${data.code} — ${data.subject}` : t('support.myTitle')} size="lg">
      <DataState loading={loading} error={error} onRetry={reload} skeletons={1} skeletonClass="h-40">
        {data && <div className="space-y-3"><Badge tone={TICKET_STATUS_TONE[data.status]}>{t(`support.status.${data.status}`)}</Badge><TicketThread ticket={data} onReply={reply} /></div>}
      </DataState>
    </Modal>
  );
}

export default function MyTickets() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useFetch(() => supportApi.mine(), []);
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold sm:text-3xl">{t('support.myTitle')}</h1><Link to="/support" className="btn-primary">{t('support.new')}</Link></div>
      <DataState loading={loading} error={error} empty={!data?.length} onRetry={reload} skeletons={2} skeletonClass="h-20">
        <ul className="space-y-3">
          {data?.map((tk) => (
            <li key={tk.id}><button onClick={() => setOpen(tk.id)} className="card flex w-full flex-wrap items-center justify-between gap-3 text-left transition hover:shadow-glow">
              <div><p className="font-semibold">{tk.subject}</p><p className="text-xs text-slate-500">{tk.code} · {t(`support.categories.${tk.category}`)} · {formatDateTime(tk.lastActivityAt, i18n.language)}</p></div>
              <Badge tone={TICKET_STATUS_TONE[tk.status]}>{t(`support.status.${tk.status}`)}</Badge>
            </button></li>
          ))}
        </ul>
      </DataState>
      {open && <Detail id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}
