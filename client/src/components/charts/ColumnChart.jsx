import { useRef, useState } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;

// Single-series vertical column chart for a time series (one bar per month).
export default function ColumnChart({ data, valueKey = 'count', color = 'var(--series-1)', emptyMessage = 'Not enough historical data yet.' }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">{emptyMessage}</div>;
  }

  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0)) * 1.15;
  const slot = innerW / data.length;
  const barW = Math.max(6, Math.min(40, slot - 10));

  const xFor = (i) => PAD_L + slot * i + (slot - barW) / 2;
  const yFor = (v) => PAD_T + innerH - (v / max) * innerH;
  const hFor = (v) => (v / max) * innerH;
  const gridLines = 4;

  return (
    <div className="column-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="trend-svg"
        role="img"
        aria-label="Monthly assessment count"
      >
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = PAD_T + (innerH / gridLines) * i;
          return <line key={i} x1={PAD_L} x2={WIDTH - PAD_R} y1={y} y2={y} className="grid-line" />;
        })}
        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + innerH} className="axis-line" />
        <line x1={PAD_L} x2={WIDTH - PAD_R} y1={PAD_T + innerH} y2={PAD_T + innerH} className="axis-line" />

        {data.map((d, i) => (
          <rect
            key={d.month}
            x={xFor(i)}
            y={yFor(d[valueKey] || 0)}
            width={barW}
            height={Math.max(0, hFor(d[valueKey] || 0))}
            rx={4}
            fill={color}
            opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.55}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}

        {data.map((d, i) => (
          <text key={d.month} x={xFor(i) + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="axis-tick">
            {i % Math.ceil(data.length / 6 || 1) === 0 ? d.month : ''}
          </text>
        ))}
      </svg>

      {hoverIdx !== null && (
        <div className="trend-tooltip" style={{ left: `${((xFor(hoverIdx) + barW / 2) / WIDTH) * 100}%` }}>
          <div className="trend-tooltip-title">{data[hoverIdx].month}</div>
          <div className="trend-tooltip-row">
            <span className="dot" style={{ background: color }} />
            {data[hoverIdx][valueKey]} assessment{data[hoverIdx][valueKey] === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
}
