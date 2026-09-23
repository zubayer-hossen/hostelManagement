import { Megaphone } from 'lucide-react';
import { contentApi } from '../api/content.js';
import { useFetch } from '../hooks/useFetch.js';
import SmartLink from './SmartLink.jsx';

/** Scrolling headline bar. Renders nothing when there are no active headlines. */
export default function HeadlineTicker() {
  const { data } = useFetch(() => contentApi.headlines(), []);
  if (!data?.length) return null;

  const row = (suffix) => data.map((h) => (
    <span key={`${h.id}${suffix}`} className="mx-6 inline-block whitespace-nowrap">
      {h.link ? <SmartLink to={h.link} className="hover:underline">{h.text}</SmartLink> : h.text}
    </span>
  ));

  return (
    <div className="flex items-center overflow-hidden bg-primary-700 text-sm font-medium text-white">
      <span className="z-10 flex shrink-0 items-center gap-2 bg-primary-800 px-3 py-2"><Megaphone size={16} aria-hidden="true" /></span>
      <div className="marquee-pause relative flex-1 overflow-hidden py-2">
        {/* motion-safe: scrolls; otherwise the first row simply wraps */}
        <div className="marquee flex w-max" aria-live="off">
          <div className="flex">{row('a')}</div>
          <div className="flex" aria-hidden="true">{row('b')}</div>
        </div>
      </div>
    </div>
  );
}
