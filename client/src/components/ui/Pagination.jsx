import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Pagination({ meta, onPage }) {
  const { t } = useTranslation();
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-sm">
      <button className="btn-secondary p-2" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label={t('common.previous')}><ChevronLeft size={18} /></button>
      <span>{meta.page} / {meta.totalPages} <span className="text-slate-400">({meta.total})</span></span>
      <button className="btn-secondary p-2" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} aria-label={t('common.next')}><ChevronRight size={18} /></button>
    </nav>
  );
}
