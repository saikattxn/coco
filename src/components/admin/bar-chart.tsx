/**
 * Minimal single-series bar chart (server-rendered SVG). One hue, recessive grid,
 * 4px rounded data-ends, a 2px gap between bars, a hover tooltip per bar (<title>),
 * and a table view for screen readers and exact values.
 */
export function BarChart({ title, data, unit = "", height = 180 }: { title: string; data: { label: string; value: number; sub?: string }[]; unit?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = niceMax(max);
  const W = 640;
  const padL = 34, padB = 26, padT = 8;
  const plotW = W - padL - 8;
  const plotH = height - padB - padT;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(3, Math.min(36, slot - 2));
  const ticks = [0, nice / 2, nice];
  const labelEvery = Math.ceil(data.length / 12);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={`${title}. Values listed in the table below.`}>
        {ticks.map((t) => {
          const y = padT + plotH - (t / nice) * plotH;
          return (
            <g key={t}>
              <line x1={padL} x2={W - 8} y1={y} y2={y} stroke="#e7ddcd" strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={11} fill="#7a6d6f">{fmt(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / nice) * plotH;
          const x = padL + i * slot + (slot - barW) / 2;
          const y = padT + plotH - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.label + i}>
              <rect x={padL + i * slot} y={padT} width={slot} height={plotH} fill="transparent">
                <title>{`${d.sub ?? d.label}: ${d.value}${unit}`}</title>
              </rect>
              {h > 0 && (
                <path d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`} fill="#9e3a4b" pointerEvents="none" />
              )}
              {i % labelEvery === 0 && (
                <text x={padL + i * slot + slot / 2} y={height - 8} textAnchor="middle" fontSize={11} fill="#7a6d6f">{d.label}</text>
              )}
            </g>
          );
        })}
        <line x1={padL} x2={W - 8} y1={padT + plotH} y2={padT + plotH} stroke="#cdbda5" strokeWidth={1} />
      </svg>
      <details className="mt-2 text-xs text-ink-soft">
        <summary className="cursor-pointer">Show as table</summary>
        <table className="mt-2 w-full max-w-sm">
          <caption className="sr-only">{title}</caption>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-line/60"><th scope="row" className="py-1 pr-4 text-left font-normal">{d.sub ?? d.label}</th><td className="py-1 tabular-nums">{d.value}{unit}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
function fmt(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : String(Math.round(v * 10) / 10);
}
