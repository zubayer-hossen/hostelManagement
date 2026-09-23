/** Small dependency-free SVG bar chart. data = [{ label, value }]. */
export default function BarChart({ data, height = 160, format = (v) => v, ariaLabel }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / data.length;
  return (
    <figure aria-label={ariaLabel}>
      <svg viewBox={`0 0 100 ${height / 4}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 4 - 4);
          return <rect key={d.label} x={i * barW + barW * 0.15} y={height / 4 - h} width={barW * 0.7} height={h} rx="0.8" className="fill-primary-500"><title>{`${d.label}: ${format(d.value)}`}</title></rect>;
        })}
      </svg>
      <figcaption className="mt-1 flex text-[11px] text-slate-500">
        {data.map((d) => <span key={d.label} className="flex-1 text-center">{d.label.slice(2)}</span>)}
      </figcaption>
    </figure>
  );
}
