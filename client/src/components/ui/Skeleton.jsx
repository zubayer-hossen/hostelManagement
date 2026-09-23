export default function Skeleton({ className = 'h-24' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800 ${className}`} />;
}
