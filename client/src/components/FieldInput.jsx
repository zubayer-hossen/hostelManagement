import { useId, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import MediaPicker from './MediaPicker.jsx';
import { useTranslation } from 'react-i18next';

/** One form control for the generic admin forms. Defined at module level so inputs never remount while typing. */
export default function FieldInput({ field, value, onChange, label }) {
  const { t } = useTranslation();
  const id = useId();
  const { name, type, required, max, options, hintKey } = field;
  const [picking, setPicking] = useState(false);
  const text = label ?? t(`cms.fields.${name}`);

  if (type === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-sm font-medium sm:col-span-1">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(name, e.target.checked)} />{text}
      </label>
    );
  }

  if (type === 'image') {
    return (
      <div className="sm:col-span-2">
        <label htmlFor={id} className="label">{text}{required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}</label>
        <div className="flex gap-2">
          <input id={id} className="field" value={value} required={required} maxLength={1000} placeholder="https://…" onChange={(e) => onChange(name, e.target.value)} />
          <button type="button" className="btn-secondary shrink-0" onClick={() => setPicking(true)}><ImagePlus size={16} />{t('media.choose')}</button>
        </div>
        {value && <img src={value} alt="" className="mt-2 h-24 rounded-lg border border-slate-200 object-cover dark:border-slate-700" />}
        <MediaPicker open={picking} onClose={() => setPicking(false)} onPick={(url) => onChange(name, url)} purpose={field.purpose || 'general'} />
      </div>
    );
  }

  const common = { id, className: 'field', value, required, maxLength: max, onChange: (e) => onChange(name, e.target.value) };
  let control;
  if (type === 'textarea' || type === 'list') control = <textarea {...common} rows={type === 'list' ? 4 : 3} />;
  else if (type === 'select') {
    control = (
      <select {...common}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.labelKey ? t(o.labelKey, { defaultValue: o.label }) : o.label}</option>)}
      </select>
    );
  } else {
    const htmlType = { number: 'number', datetime: 'datetime-local', date: 'date', color: 'color' }[type] || 'text';
    control = <input {...common} type={htmlType} step={type === 'number' ? 'any' : undefined} className={type === 'color' ? 'h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-800' : 'field'} />;
  }

  return (
    <div className={['textarea', 'list'].includes(type) ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="label">{text}{required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}</label>
      {control}
      {hintKey && <p className="mt-1 text-xs text-slate-500">{t(hintKey)}</p>}
    </div>
  );
}
