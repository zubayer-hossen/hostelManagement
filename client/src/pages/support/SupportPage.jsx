import { useState } from 'react';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader.jsx';
import TicketThread from '../../components/TicketThread.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import EmergencyCard from '../../components/EmergencyCard.jsx';
import { supportApi, TICKET_CATEGORIES, TICKET_STATUS_TONE } from '../../api/support.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

function NewTicket() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [v, setV] = useState({ name: '', email: '', phone: '', category: 'general', subject: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const body = Object.fromEntries(Object.entries(v).filter(([k, val]) => val !== '' && (!isAuthenticated || !['name', 'email'].includes(k))));
    try { const res = await supportApi.create({ ...body, website: v.website }); setDone(res.data); } catch (err) {
      setError(getFieldErrors(err).map((x) => x.message).join(' · ') || getErrorMessage(err));
    } finally { setBusy(false); }
  };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast.success(t('media.copied')); } catch { toast.error(text); } };

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title={t('support.received')}>{t('support.receivedText')}</Alert>
        <div className="card space-y-3 text-sm">
          <p>{t('support.yourCode')}: <strong className="font-mono text-base">{done.ticket.code}</strong> <button className="ml-1 text-primary-600" onClick={() => copy(done.ticket.code)} aria-label={t('media.copyUrl')}><Copy size={14} className="inline" /></button></p>
          {done.trackingToken && (
            <>
              <p>{t('support.yourKey')}: <strong className="break-all font-mono">{done.trackingToken}</strong> <button className="ml-1 text-primary-600" onClick={() => copy(done.trackingToken)} aria-label={t('media.copyUrl')}><Copy size={14} className="inline" /></button></p>
              <Alert tone="info">{t('support.keyWarning')}</Alert>
            </>
          )}
        </div>
        <Button variant="secondary" onClick={() => { setDone(null); setV({ ...v, subject: '', message: '' }); }}>{t('support.another')}</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {isAuthenticated && <p className="text-sm text-slate-500">{t('support.signedInAs', { name: user.name, email: user.email })}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {!isAuthenticated && <label className="block"><span className="label">{t('common.name')}</span><input className="field" required minLength={2} maxLength={80} value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></label>}
        {!isAuthenticated && <label className="block"><span className="label">{t('common.email')}</span><input className="field" type="email" required value={v.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></label>}
        <label className="block"><span className="label">{t('common.phone')} ({t('common.optional')})</span><input className="field" type="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        <label className="block"><span className="label">{t('complaints.category')}</span><select className="field" value={v.category} onChange={(e) => set('category', e.target.value)}>{TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{t(`support.categories.${c}`)}</option>)}</select></label>
      </div>
      {v.category === 'emergency' && <Alert tone="error">{t('support.emergencyNote')}</Alert>}
      <label className="block"><span className="label">{t('complaints.subject')}</span><input className="field" required minLength={3} maxLength={140} value={v.subject} onChange={(e) => set('subject', e.target.value)} /></label>
      <label className="block"><span className="label">{t('public.contact.message')}</span><textarea className="field" rows={5} required minLength={10} maxLength={3000} value={v.message} onChange={(e) => set('message', e.target.value)} /></label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website', e.target.value)} /></label></div>
      <Button type="submit" loading={busy}>{t('support.submit')}</Button>
    </form>
  );
}

function Track() {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { setTicket((await supportApi.track({ code: code.trim(), token: token.trim() })).data); } catch (err) { setTicket(null); setError(getFieldErrors(err).map((x) => x.message).join(' · ') || getErrorMessage(err)); } finally { setBusy(false); }
  };
  const reply = async ({ text }) => {
    try { setTicket((await supportApi.trackReply({ code: code.trim(), token: token.trim(), text })).data); toast.success(t('complaints.submitted')); } catch (err) { toast.error(getErrorMessage(err)); throw err; }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={lookup} className="card grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <label className="block"><span className="label">{t('support.yourCode')}</span><input className="field font-mono uppercase" placeholder="TKT-XXXXXX" required value={code} onChange={(e) => setCode(e.target.value)} /></label>
        <label className="block"><span className="label">{t('support.yourKey')}</span><input className="field font-mono" required minLength={32} maxLength={32} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" /></label>
        <Button type="submit" loading={busy}>{t('support.track')}</Button>
      </form>
      {error && <Alert tone="error">{error}</Alert>}
      {ticket && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{ticket.subject}</h2><Badge tone={TICKET_STATUS_TONE[ticket.status]}>{t(`support.status.${ticket.status}`)}</Badge></div>
          <TicketThread ticket={ticket} onReply={reply} />
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { t } = useTranslation();
  usePageTitle(t('support.title'));
  const [tab, setTab] = useState('new');
  return (
    <>
      <PageHeader title={t('support.title')} subtitle={t('support.subtitle')} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div role="tablist" className="mb-5 flex gap-2">
            {['new', 'track'].map((k) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{t(`support.tabs.${k}`)}</button>)}
          </div>
          {tab === 'new' ? <NewTicket /> : <Track />}
        </div>
        <aside className="space-y-4"><EmergencyCard /><p className="text-sm text-slate-500">{t('support.aside')}</p></aside>
      </div>
    </>
  );
}
