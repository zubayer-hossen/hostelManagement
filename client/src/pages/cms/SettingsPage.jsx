import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import FieldInput from '../../components/FieldInput.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Forbidden from '../Forbidden.jsx';
import { settingsApi } from '../../api/settings.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { DEFAULT_NAV, DEFAULT_HOME_SECTIONS } from '../../constants/site.js';
import { initialValues, toBody } from '../../utils/formFields.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';

const f = (name, type = 'text', extra = {}) => ({ name, type, ...extra });
const URLF = (name) => f(name, 'text', { max: 1000 });

const SECTIONS = {
  general: [f('hostelName', 'text', { required: true, max: 120 }), f('tagline', 'text', { max: 200 }), f('description', 'textarea', { max: 1000 }), URLF('logoUrl'), URLF('faviconUrl'), f('address', 'text', { max: 400 })],
  contact: [f('phone', 'text', { max: 30 }), f('email', 'text', { max: 254 }), f('emergencyPhone', 'text', { max: 30 }), f('officeHours', 'text', { max: 200 }), f('supportInfo', 'textarea', { max: 500 })],
  social: ['facebook', 'instagram', 'youtube', 'whatsapp', 'messenger', 'tiktok', 'linkedin'].map(URLF),
  location: [f('latitude', 'number', { nullable: true }), f('longitude', 'number', { nullable: true }), URLF('mapEmbedUrl'), f('nearbyLandmarks', 'textarea', { max: 500 }), f('transportInfo', 'textarea', { max: 500 })],
  emergency: [f('hostelContact', 'text', { max: 60 }), f('police', 'text', { max: 30 }), f('ambulance', 'text', { max: 30 }), f('fire', 'text', { max: 30 }), f('hospital', 'text', { max: 120 })],
  theme: [f('mode', 'select', { options: ['light', 'dark', 'system'].map((v) => ({ value: v, labelKey: `common.${v}`, label: v })) }), f('primaryColor', 'color'), f('secondaryColor', 'color'), f('accentColor', 'color'),
    f('borderRadius', 'select', { options: ['none', 'sm', 'md', 'lg', 'xl'].map((v) => ({ value: v, label: v })) }), f('animations', 'boolean')],
  seo: [f('siteTitle', 'text', { max: 120 }), f('metaDescription', 'textarea', { max: 300 }), f('keywords', 'text', { max: 300 }), URLF('ogImageUrl')],
  footer: [f('showQuickLinks', 'boolean'), f('copyrightText', 'text', { max: 200 })],
  visitorStats: [f('showOnlineNow', 'boolean'), f('showToday', 'boolean'), f('showTotal', 'boolean')],
};
const TABS = [...Object.keys(SECTIONS), 'meetings', 'navigation', 'homeSections', 'residentForm'];
const BIODATA = ['photoUrl', 'fatherName', 'motherName', 'dateOfBirth', 'phone', 'email', 'emergencyContact', 'permanentAddress', 'presentAddress', 'nationality', 'occupation', 'institution', 'department', 'bloodGroup', 'guardian', 'expectedLeavingDate'];
const DEFAULT_REQUIRED = ['dateOfBirth', 'emergencyContact', 'permanentAddress'];

function useSave(section) {
  const { t } = useTranslation();
  const { reload } = useSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async (body) => {
    setBusy(true); setError(null);
    try { await settingsApi.update({ [section]: body }); await reload(); toast.success(t('cms.saved')); } catch (err) {
      setError(getFieldErrors(err).map((e) => `${e.field}: ${e.message}`).join(' · ') || getErrorMessage(err));
    } finally { setBusy(false); }
  };
  return { save, busy, error };
}

function FieldsSection({ section }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const fields = SECTIONS[section];
  const [values, setValues] = useState(() => initialValues(fields, settings[section]));
  const { save, busy, error } = useSave(section);
  const set = (name, v) => setValues((s) => ({ ...s, [name]: v }));
  return (
    <div className="card space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((fd) => <FieldInput key={fd.name} field={fd} value={values[fd.name]} onChange={set} label={t(`settings.fields.${fd.name}`)} />)}
      </div>
      {section === 'theme' && <p className="text-xs text-slate-500">{t('settings.themeNote')}</p>}
      <div className="text-right"><Button loading={busy} onClick={() => save(toBody(fields, values))}>{t('common.save')}</Button></div>
    </div>
  );
}

function move(list, i, d) {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
const Arrows = ({ i, n, onMove }) => (
  <span className="flex">
    <button type="button" className="btn-ghost p-1.5" disabled={i === 0} onClick={() => onMove(-1)} aria-label="Up"><ArrowUp size={16} /></button>
    <button type="button" className="btn-ghost p-1.5" disabled={i === n - 1} onClick={() => onMove(1)} aria-label="Down"><ArrowDown size={16} /></button>
  </span>
);

function NavigationSection() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [rows, setRows] = useState(() => (settings.navigation?.length ? settings.navigation : DEFAULT_NAV).map((r) => ({ ...r })));
  const { save, busy, error } = useSave('navigation');
  const patch = (i, p) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const add = () => setRows((r) => [...r, { key: `item-${Date.now().toString(36)}`, label: '', labelBn: '', path: '/', enabled: true }]);
  const invalid = rows.some((r) => !r.label.trim() || !/^\/[A-Za-z0-9\-_/]*$/.test(r.path));
  return (
    <div className="card space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-sm text-slate-500">{t('settings.navHint')}</p>
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.key} className="grid items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-[1fr_1fr_1fr_auto_auto_auto]">
            <input className="field" aria-label="Label" placeholder="Label" value={r.label} maxLength={40} onChange={(e) => patch(i, { label: e.target.value })} />
            <input className="field" aria-label="বাংলা" placeholder="বাংলা" value={r.labelBn} maxLength={40} onChange={(e) => patch(i, { labelBn: e.target.value })} />
            <input className="field" aria-label="Path" placeholder="/path" value={r.path} maxLength={200} onChange={(e) => patch(i, { path: e.target.value })} />
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={r.enabled} onChange={(e) => patch(i, { enabled: e.target.checked })} />{t('cms.active')}</label>
            <Arrows i={i} n={rows.length} onMove={(d) => setRows((x) => move(x, i, d))} />
            <button type="button" className="btn-ghost p-1.5 text-red-600" onClick={() => setRows((x) => x.filter((_, k) => k !== i))} aria-label={t('cms.delete')}><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
      <div className="flex justify-between"><Button variant="secondary" onClick={add}><Plus size={16} />{t('cms.new')}</Button><Button loading={busy} disabled={invalid} onClick={() => save(rows.map(({ key, label, labelBn, path, enabled }) => ({ key, label: label.trim(), labelBn: labelBn.trim(), path: path.trim(), enabled })))}>{t('common.save')}</Button></div>
    </div>
  );
}

function HomeSectionsSection() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [rows, setRows] = useState(() => (settings.homeSections?.length ? settings.homeSections : DEFAULT_HOME_SECTIONS).map((r) => ({ ...r })));
  const { save, busy, error } = useSave('homeSections');
  return (
    <div className="card space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-sm text-slate-500">{t('settings.homeHint')}</p>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={r.enabled} onChange={(e) => setRows((x) => x.map((y, k) => (k === i ? { ...y, enabled: e.target.checked } : y)))} />{t(`settings.homeSections.${r.key}`)}</label>
            <Arrows i={i} n={rows.length} onMove={(d) => setRows((x) => move(x, i, d))} />
          </li>
        ))}
      </ul>
      <div className="text-right"><Button loading={busy} onClick={() => save(rows)}>{t('common.save')}</Button></div>
    </div>
  );
}

const MEETING_DEFAULTS = { enabled: true, days: [0, 1, 2, 3, 4], startTime: '10:00', endTime: '17:00', slotMinutes: 30, maxPerSlot: 1, maxAdvanceDays: 30, utcOffsetMinutes: 360, blackoutDates: [] };

function MeetingsSection() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [m, setM] = useState(() => ({ ...MEETING_DEFAULTS, ...(settings.meetings || {}) }));
  const [blackout, setBlackout] = useState(() => (m.blackoutDates || []).join('\n'));
  const { save, busy, error } = useSave('meetings');
  const set = (k, v) => setM((s) => ({ ...s, [k]: v }));
  const num = (k) => (e) => set(k, e.target.value === '' ? '' : Number(e.target.value));
  const toggleDay = (d) => set('days', m.days.includes(d) ? m.days.filter((x) => x !== d) : [...m.days, d].sort());
  const body = () => ({
    enabled: Boolean(m.enabled), days: m.days, startTime: m.startTime, endTime: m.endTime, slotMinutes: Number(m.slotMinutes), maxPerSlot: Number(m.maxPerSlot),
    maxAdvanceDays: Number(m.maxAdvanceDays), utcOffsetMinutes: Number(m.utcOffsetMinutes), blackoutDates: blackout.split('\n').map((x) => x.trim()).filter(Boolean),
  });
  return (
    <div className="card space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={m.enabled} onChange={(e) => set('enabled', e.target.checked)} />{t('settings.fields.meetingsEnabled')}</label>
      <div><span className="label">{t('settings.fields.days')}</span>
        <div className="flex flex-wrap gap-3 text-sm">{[0, 1, 2, 3, 4, 5, 6].map((d) => <label key={d} className="flex items-center gap-1.5"><input type="checkbox" checked={m.days.includes(d)} onChange={() => toggleDay(d)} />{t(`settings.weekdays.${d}`)}</label>)}</div></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block"><span className="label">{t('settings.fields.startTime')}</span><input className="field" type="time" value={m.startTime} onChange={(e) => set('startTime', e.target.value)} /></label>
        <label className="block"><span className="label">{t('settings.fields.endTime')}</span><input className="field" type="time" value={m.endTime} onChange={(e) => set('endTime', e.target.value)} /></label>
        <label className="block"><span className="label">{t('settings.fields.slotMinutes')}</span><input className="field" type="number" min="10" max="240" value={m.slotMinutes} onChange={num('slotMinutes')} /></label>
        <label className="block"><span className="label">{t('settings.fields.maxPerSlot')}</span><input className="field" type="number" min="1" max="10" value={m.maxPerSlot} onChange={num('maxPerSlot')} /></label>
        <label className="block"><span className="label">{t('settings.fields.maxAdvanceDays')}</span><input className="field" type="number" min="1" max="180" value={m.maxAdvanceDays} onChange={num('maxAdvanceDays')} /></label>
        <label className="block"><span className="label">{t('settings.fields.utcOffsetMinutes')}</span><input className="field" type="number" min="-720" max="840" value={m.utcOffsetMinutes} onChange={num('utcOffsetMinutes')} /><span className="mt-1 block text-xs text-slate-500">{t('settings.offsetHint')}</span></label>
      </div>
      <label className="block"><span className="label">{t('settings.fields.blackoutDates')}</span><textarea className="field font-mono text-sm" rows={4} value={blackout} onChange={(e) => setBlackout(e.target.value)} placeholder="2026-12-16" /><span className="mt-1 block text-xs text-slate-500">{t('settings.blackoutHint')}</span></label>
      <div className="text-right"><Button loading={busy} onClick={() => save(body())}>{t('common.save')}</Button></div>
    </div>
  );
}

function ResidentFormSection() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [required, setRequired] = useState(() => settings.residentForm?.requiredFields ?? DEFAULT_REQUIRED);
  const { save, busy, error } = useSave('residentForm');
  const toggle = (k) => setRequired((r) => (r.includes(k) ? r.filter((x) => x !== k) : [...r, k]));
  return (
    <div className="card space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <p className="text-sm text-slate-500">{t('settings.residentHint')}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BIODATA.map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={required.includes(k)} onChange={() => toggle(k)} />{t(`resident.fields.${k}`)}</label>)}
      </div>
      <div className="text-right"><Button loading={busy} onClick={() => save({ requiredFields: required })}>{t('common.save')}</Button></div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { loading } = useSettings();
  const [tab, setTab] = useState('general');
  if (!hasPermission('manageSettings')) return <Forbidden />;
  if (loading) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('settings.title')}</h1>
      <div role="tablist" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((k) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{t(`settings.tabs.${k}`)}</button>)}
      </div>
      {/* key = tab so every tab starts from the latest saved settings */}
      {SECTIONS[tab] ? <FieldsSection key={tab} section={tab} /> : tab === 'meetings' ? <MeetingsSection key={tab} /> : tab === 'navigation' ? <NavigationSection key={tab} /> : tab === 'homeSections' ? <HomeSectionsSection key={tab} /> : <ResidentFormSection key={tab} />}
    </div>
  );
}
