'use client';

import { useMemo } from 'react';

export interface BarStripDatum {
  label: string;
  value: number;
}

export interface BarStripProps {
  data: BarStripDatum[];
  height?: number;
  /** Optional CSS var or color for bar fill. */
  color?: string;
  ariaLabel?: string;
}

/**
 * Horizontal bar strip used for "top items" listings.
 * Width is relative to the largest value. O(n).
 */
export function BarStrip({ data, color = 'var(--chart-1)', ariaLabel }: BarStripProps) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  return (
    <div className="flex flex-col gap-1.5" role="img" aria-label={ariaLabel}>
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div
            key={d.label}
            className="relative h-7 overflow-hidden rounded-md bg-paper-warm"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                opacity: 0.18,
              }}
            />
            <div className="relative flex h-full items-center justify-between px-2.5 text-xs">
              <span className="truncate font-medium text-ink">{d.label}</span>
              <span className="ml-2 shrink-0 font-mono tabular text-ink/60">
                {d.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
