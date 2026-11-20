'use client';

import React, { useState } from 'react';

interface TrendChartProps {
  title: string;
  subtitle: string;
  data: Array<{ date: string; value: number }>;
  color?: string;
  fillColor?: string;
  valueFormatter?: (val: number) => string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  subtitle,
  data,
  color = '#22c55e',
  fillColor = 'rgba(34, 197, 94, 0.15)',
  valueFormatter = (v) => v.toLocaleString(),
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 text-slate-400 text-sm">
        No trend data available.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Chart dimensions inside SVG viewBox
  const width = 600;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const pathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${
    points[0].x
  } ${height - paddingY} Z`;

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="mt-2 sm:mt-0 text-right">
          <span className="text-lg font-bold text-white">
            {hoveredIdx !== null
              ? valueFormatter(data[hoveredIdx].value)
              : valueFormatter(data[data.length - 1].value)}
          </span>
          <span className="block text-[11px] text-slate-400">
            {hoveredIdx !== null ? data[hoveredIdx].date : 'Latest Value'}
          </span>
        </div>
      </div>

      <div className="relative pt-4 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#334155"
          />

          {/* Area fill */}
          <path d={areaD} fill={`url(#gradient-${title.replace(/\s+/g, '')})`} />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive points */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? 6 : 3}
                fill={hoveredIdx === idx ? '#ffffff' : color}
                stroke={color}
                strokeWidth={hoveredIdx === idx ? 2 : 1}
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-slate-500 pt-2 px-1">
          <span>{data[0].date}</span>
          <span>{data[Math.floor(data.length / 2)].date}</span>
          <span>{data[data.length - 1].date}</span>
        </div>
      </div>
    </div>
  );
};
