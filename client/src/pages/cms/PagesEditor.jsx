import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import RichText from '../../components/RichText.jsx';
import MarkdownToolbar from '../../components/MarkdownToolbar.jsx';
import Forbidden from '../Forbidden.jsx';
import { pagesApi } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../utils/errors.js';

const KEYS = ['about', 'boys', 'girls', 'rules', 'terms', 'privacy'];

export default function PagesEditor() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [key, setKey] = useState('about');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const area = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const allowed = hasPermission('manageRules') || hasPermission('manageSettings');

  useEffect(() => {
    if (!allowed) return undefined;
    let cancelled = false;
    setLoading(true); setError(null);
    pagesApi.get(key)
      .then((r) => { if (!cancelled) { setTitle(r.data.title); setContent(r.data.content); } })
      .catch((err) => { if (!cancelled) { setTitle(t(`cms.pageNames.${key}`)); setContent(''); if (err?.response?.status !== 404) setError(getErrorMessage(err)); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [key, allowed, t]);

  if (!allowed) return <Forbidden />;

  const save = async () => {
    setSaving(true); setError(null);
    try { await pagesApi.save(key, { title: title.trim(), content }); toast.success(t('cms.saved')); } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('cms.resources.pages')}</h1>
      <div role="tablist" className="flex flex-wrap gap-2">
        {KEYS.map((k) => <button key={k} role="tab" aria-selected={key === k} onClick={() => setKey(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${key === k ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{t(`cms.pageNames.${k}`)}</button>)}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {loading ? <div className="flex justify-center py-16 text-primary-600"><Spinner className="h-8 w-8" /></div> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card space-y-4">
            <label className="block"><span className="label">{t('cms.fields.title')}</span><input className="field" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} /></label>
            <div><span className="label">{t('cms.fields.content')}</span><MarkdownToolbar textareaRef={area} value={content} onChange={setContent} /><textarea ref={area} className="field font-mono text-sm" rows={18} maxLength={50000} value={content} onChange={(e) => setContent(e.target.value)} /></div>
            <p className="text-xs text-slate-500">{t('cms.hints.markdown')}</p>
            <div className="text-right"><Button loading={saving} disabled={title.trim().length < 2} onClick={save}>{t('common.save')}</Button></div>
          </div>
          <div className="card"><p className="mb-3 text-xs font-semibold uppercase text-slate-500">{t('cms.preview')}</p><h2 className="mb-4 text-2xl font-bold">{title}</h2><RichText content={content} /></div>
        </div>
      )}
    </div>
  );
}
