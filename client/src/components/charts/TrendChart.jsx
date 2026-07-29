import { useState, useRef } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

export default function TrendChart({ data, series }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  if (!data.length) {
    return <div className="chart-empty">Not enough historical data yet.</div>;
  }

  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;
  const allValues = data.flatMap((d) => series.map((s) => d[s.key] || 0));
  const maxY = Math.max(1, ...allValues) * 1.1;

  const xFor = (i) => PAD_L + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yFor = (v) => PAD_T + innerH - (v / maxY) * innerH;

  const pathFor = (key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d[key] || 0)}`).join(' ');

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let idx = Math.round(((x - PAD_L) / innerW) * (data.length - 1));
    idx = Math.max(0, Math.min(data.length - 1, idx));
    setHoverIdx(idx);
  };

  const gridLines = 4;

  return (
    <div className="trend-chart">
      <div className="legend legend-top">
        {series.map((s) => (
          <div key={s.key} className="legend-item">
            <span className="dot" style={{ background: s.color }} /> {s.label}
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="trend-svg"
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Trend chart"
      >
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = PAD_T + (innerH / gridLines) * i;
          return <line key={i} x1={PAD_L} x2={WIDTH - PAD_R} y1={y} y2={y} className="grid-line" />;
        })}
        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + innerH} className="axis-line" />
        <line x1={PAD_L} x2={WIDTH - PAD_R} y1={PAD_T + innerH} y2={PAD_T + innerH} className="axis-line" />

        {series.map((s) => (
          <path key={s.key} d={pathFor(s.key)} className="trend-line" stroke={s.color} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {data.map((d, i) => (
          <text key={d.month} x={xFor(i)} y={HEIGHT - 8} textAnchor="middle" className="axis-tick">
            {i % Math.ceil(data.length / 6 || 1) === 0 ? d.month : ''}
          </text>
        ))}

        {hoverIdx !== null && (
          <>
            <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={PAD_T} y2={PAD_T + innerH} className="crosshair" />
            {series.map((s) => (
              <circle key={s.key} cx={xFor(hoverIdx)} cy={yFor(data[hoverIdx][s.key] || 0)} r={4} fill={s.color} stroke="var(--surface-1)" strokeWidth={2} />
            ))}
          </>
        )}
      </svg>

      {hoverIdx !== null && (
        <div className="trend-tooltip" style={{ left: `${(xFor(hoverIdx) / WIDTH) * 100}%` }}>
          <div className="trend-tooltip-title">{data[hoverIdx].month}</div>
          {series.map((s) => (
            <div key={s.key} className="trend-tooltip-row">
              <span className="dot" style={{ background: s.color }} />
              {s.label}: {(data[hoverIdx][s.key] || 0).toFixed(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
