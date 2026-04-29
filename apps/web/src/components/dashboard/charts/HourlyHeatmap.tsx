'use client';

import { useMemo } from 'react';

export interface HourlyHeatmapProps {
  /** 24 entries, one per hour (00..23). */
  data: Array<{ at: string; orders: number }>;
  ariaLabel?: string;
}

/**
 * 24-cell heatmap of "today" by hour. Pure CSS grid; O(24) regardless of input size.
 */
export function HourlyHeatmap({ data, ariaLabel }: HourlyHeatmapProps) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.orders)), [data]);

  return (
    <div
      className="grid grid-cols-12 gap-1"
      role="img"
      aria-label={ariaLabel ?? 'Orders by hour today'}
    >
      {data.map((d, hour) => {
        const intensity = d.orders / max;
        // 0 → flat paper-warm tint, 1 → full brand
        const alpha = d.orders === 0 ? 0.05 : 0.18 + intensity * 0.72;
        return (
          <div
            key={hour}
            className="group relative aspect-square rounded-md transition-transform hover:scale-110"
            style={{
              backgroundColor: `rgba(226, 70, 28, ${alpha})`,
            }}
            title={`${formatHour(hour)} · ${d.orders} order${d.orders === 1 ? '' : 's'}`}
          >
            <span className="pointer-events-none absolute inset-x-0 -top-7 z-10 mx-auto hidden w-max rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-medium text-paper group-hover:block">
              {formatHour(hour)} · {d.orders}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}
