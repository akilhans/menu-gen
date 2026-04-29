import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface FinalCtaProps {
  id?: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export function FinalCta({
  id = 'pricing',
  title,
  description,
  ctaLabel,
  ctaHref,
}: FinalCtaProps) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-paper md:p-16">
        <div className="relative z-10 max-w-xl">
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">{title}</h2>
          <p className="mt-4 text-paper/70">{description}</p>
          <Link
            href={ctaHref}
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-medium text-white hover:opacity-90"
          >
            {ctaLabel} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-brand/20 blur-3xl" />
      </div>
    </section>
  );
}
