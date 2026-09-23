import { Bold, Heading2, Italic, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Formatting buttons for the light-markdown textareas (## heading, - bullet, **bold**, *note*). No HTML is ever produced. */
export default function MarkdownToolbar({ textareaRef, value, onChange }) {
  const { t } = useTranslation();

  const apply = (kind) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let next;
    let caret;
    if (kind === 'bold') {
      const sel = value.slice(start, end) || t('cms.toolbar.text');
      next = `${value.slice(0, start)}**${sel}**${value.slice(end)}`;
      caret = start + 2 + sel.length + 2;
    } else {
      const prefix = { heading: '## ', bullet: '- ', note: '*' }[kind];
      const suffix = kind === 'note' ? '*' : '';
      const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
      const block = value.slice(lineStart, lineEnd) || t('cms.toolbar.text');
      const changed = block.split('\n').map((l) => `${prefix}${l}${suffix}`).join('\n');
      next = value.slice(0, lineStart) + changed + value.slice(lineEnd);
      caret = lineStart + changed.length;
    }
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret, caret); });
  };

  const Btn = ({ kind, icon: Icon, label }) => (
    <button type="button" className="btn-ghost p-2" onClick={() => apply(kind)} aria-label={label} title={label}><Icon size={16} /></button>
  );
  return (
    <div role="toolbar" aria-label={t('cms.toolbar.label')} className="mb-1 flex gap-1">
      <Btn kind="heading" icon={Heading2} label={t('cms.toolbar.heading')} />
      <Btn kind="bold" icon={Bold} label={t('cms.toolbar.bold')} />
      <Btn kind="bullet" icon={List} label={t('cms.toolbar.bullet')} />
      <Btn kind="note" icon={Italic} label={t('cms.toolbar.note')} />
    </div>
  );
}
