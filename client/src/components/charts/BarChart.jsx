import { useState } from 'react';

// Single-series horizontal bar chart. One hue (sequential blue), thin bars,
// rounded data-ends, hover tooltip, direct value labels.
export default function BarChart({
  data, labelKey, valueKey, colorFor, height = 24, compact = false,
  showPercent = false, emptyMessage = 'Not enough historical data yet.'
}) {
  const [hover, setHover] = useState(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">{emptyMessage}</div>;
  }

  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const total = data.reduce((sum, d) => sum + d[valueKey], 0);

  return (
    <div className={`bar-chart ${compact ? 'bar-chart-compact' : ''}`} role="img" aria-label="Bar chart">
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        const share = total > 0 ? Math.round((d[valueKey] / total) * 100) : 0;
        const color = colorFor ? colorFor(d, i) : 'var(--series-1)';
        return (
          <div
            key={d[labelKey]}
            className="bar-row"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="bar-label" title={d[labelKey]}>{d[labelKey]}</div>
            <div className="bar-track" style={{ height }}>
              <div
                className="bar-fill"
                style={{ width: `${pct}%`, background: color, height }}
              />
              {hover === i && (
                <div className="bar-tooltip">{d[valueKey]}{showPercent ? ` (${share}%)` : ''}</div>
              )}
            </div>
            <div className="bar-value">
              {d[valueKey]}
              {showPercent && <span className="bar-percent">{share}%</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
