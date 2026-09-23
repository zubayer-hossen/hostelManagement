import { Fragment } from 'react';

/**
 * Renders the admin's plain text with light markdown: "## Heading", "- bullet", "*italic line*", **bold**.
 * It builds React elements (never raw HTML), so admin content cannot inject scripts.
 */
function inline(text, keyBase) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>
      : <Fragment key={`${keyBase}-${i}`}>{part}</Fragment>
  );
}

export default function RichText({ content = '', className = '' }) {
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push({ type: 'ul', items: list }); list = null; } };

  content.split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) return flush();
    if (line.startsWith('## ')) { flush(); blocks.push({ type: 'h2', text: line.slice(3) }); }
    else if (line.startsWith('# ')) { flush(); blocks.push({ type: 'h2', text: line.slice(2) }); }
    else if (/^[-•]\s+/.test(line)) { (list ||= []).push(line.replace(/^[-•]\s+/, '')); }
    else if (/^\*[^*].*\*$/.test(line)) { flush(); blocks.push({ type: 'em', text: line.slice(1, -1) }); }
    else { flush(); blocks.push({ type: 'p', text: line }); }
  });
  flush();

  return (
    <div className={`space-y-3 leading-relaxed text-slate-700 dark:text-slate-300 ${className}`}>
      {blocks.map((b, i) => {
        if (b.type === 'h2') return <h2 key={i} className="!mt-7 text-xl font-bold">{b.text}</h2>;
        if (b.type === 'ul') return <ul key={i} className="list-disc space-y-1 pl-6">{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ul>;
        if (b.type === 'em') return <p key={i} className="rounded-lg bg-slate-100 p-3 text-sm italic text-slate-500 dark:bg-slate-800 dark:text-slate-400">{b.text}</p>;
        return <p key={i}>{inline(b.text, i)}</p>;
      })}
    </div>
  );
}
