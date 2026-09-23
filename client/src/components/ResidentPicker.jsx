import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { residentApi } from '../api/residents.js';
import { useDebounce } from '../hooks/useDebounce.js';

/** Search-and-select a resident (staff forms). Calls onSelect({id, fullName}). */
export default function ResidentPicker({ onSelect, selected }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const search = useDebounce(q);

  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return undefined; }
    let cancelled = false;
    residentApi.list({ search: search.trim(), limit: 6 }).then((r) => { if (!cancelled) setResults(r.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [search]);

  return (
    <div>
      <label className="label" htmlFor="resident-search">{t('finance.resident')}</label>
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
          <span className="font-medium">{selected.fullName}</span>
          <button type="button" className="text-xs font-semibold text-primary-600" onClick={() => onSelect(null)}>{t('finance.change')}</button>
        </div>
      ) : (
        <>
          <input id="resident-search" className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('finance.searchResident')} autoComplete="off" />
          {results.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow dark:border-slate-700 dark:bg-slate-900">
              {results.map((r) => <li key={r.id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onSelect({ id: r.id, fullName: r.fullName }); setQ(''); setResults([]); }}>{r.fullName} <span className="text-xs text-slate-500">{r.phone}</span></button></li>)}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
