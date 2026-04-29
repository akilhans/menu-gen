'use client';

import { useId, useMemo } from 'react';

export interface SparklinePoint {
  at: string;
  value: number;
}

export interface SparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  ariaLabel?: string;
  showLastDot?: boolean;
}

/**
 * Minimal SVG sparkline. O(n) build, no deps.
 *
 * Renders nothing if `data` is empty or all-zero.
 *
 * @example
 *   <Sparkline data={daily.map(d => ({ at: d.at, value: d.revenue }))} />
 */
export function Sparkline({
  data,
  width = 320,
  height = 64,
  stroke = 'var(--chart-1, #e2461c)',
  fill = 'rgba(226, 70, 28, 0.12)',
  ariaLabel,
  showLastDot = true,
}: SparklineProps) {
  const gradientId = useId();

  const { path, area, lastPoint, max } = useMemo(() => {
    if (data.length === 0) return { path: '', area: '', lastPoint: null, max: 0 };
    const max = Math.max(1, ...data.map((d) => d.value));
    const stepX = data.length === 1 ? 0 : width / (data.length - 1);
    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = height - (d.value / max) * (height - 6) - 3;
      return { x, y };
    });
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
    const areaPath = `${linePath} L${(points.at(-1)?.x ?? 0).toFixed(2)},${height} L0,${height} Z`;
    return { path: linePath, area: areaPath, lastPoint: points.at(-1) ?? null, max };
  }, [data, width, height]);

  if (!data.length || max === 0) {
    return (
      <div
        className="hatch h-16 w-full rounded-xl"
        role="img"
        aria-label={ariaLabel ?? 'No data'}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-full w-full"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.85} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      {showLastDot && lastPoint ? (
        <g>
          <circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill={stroke} fillOpacity={0.18} />
          <circle cx={lastPoint.x} cy={lastPoint.y} r={2.5} fill={stroke} />
        </g>
      ) : null}
    </svg>
  );
}
