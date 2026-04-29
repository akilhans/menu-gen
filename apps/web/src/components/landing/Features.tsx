import type { ReactNode } from 'react';

export interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

export interface FeaturesProps {
  id?: string;
  title: string;
  subtitle?: string;
  items: Feature[];
}

export function Features({ id = 'features', title, subtitle, items }: FeaturesProps) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 py-24">
      <div className="mb-12 flex items-end justify-between">
        <h2 className="font-display text-3xl tracking-tight md:text-5xl">{title}</h2>
        {subtitle ? (
          <p className="hidden max-w-xs text-sm text-ink/60 md:block">{subtitle}</p>
        ) : null}
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-soft"
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-paper text-ink">
              {f.icon}
            </div>
            <h3 className="font-display text-xl tracking-tight">{f.title}</h3>
            <p className="mt-2 text-sm text-ink/60">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
