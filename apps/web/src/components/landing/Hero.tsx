'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PlayCircle, QrCode, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HeroCta = {
  label: string;
  href: string;
};

export type HeroStat = {
  value: string;
  label: string;
};

export interface HeroProps {
  badge?: string;
  headingPre: string;
  headingAccent: string;
  headingPost: string;
  description: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  footnote?: string;
  imageSrc?: string;
  imageAlt?: string;
  stats?: HeroStat[];
  className?: string;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=96&h=96&q=80',
];

export function Hero({
  badge,
  headingPre,
  headingAccent,
  headingPost,
  description,
  primaryCta,
  secondaryCta,
  footnote,
  imageSrc = DEFAULT_IMAGE,
  imageAlt = 'Restaurant menu preview',
  stats,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden',
        'pt-12 pb-16 md:pt-20 md:pb-28',
        className
      )}
    >
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute top-32 -left-32 h-[420px] w-[420px] rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.7),_transparent_60%)]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-12 md:gap-10">
        {/* Copy column */}
        <div className="md:col-span-6">
          {badge ? (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/70 shadow-soft backdrop-blur">
              <Sparkles size={12} className="text-brand" />
              {badge}
              <ArrowRight size={12} className="text-ink/40" />
            </div>
          ) : null}

          <h1 className="font-display text-5xl leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
            {headingPre}
            <br />
            <span className="relative inline-block">
              <span className="italic text-brand">{headingAccent}</span>
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 right-0 h-2 -skew-x-6 rounded-full bg-brand/20"
              />
            </span>{' '}
            {headingPost}
          </h1>

          <p className="mt-6 max-w-lg text-base text-ink/70 md:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={primaryCta.href}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-medium text-paper shadow-card transition-transform hover:-translate-y-0.5 hover:bg-ink-soft"
            >
              {primaryCta.label}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href={secondaryCta.href}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/80 px-6 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-white"
            >
              <PlayCircle size={16} className="text-brand" />
              {secondaryCta.label}
            </Link>
          </div>

          {footnote ? (
            <p className="mt-4 text-xs text-ink-muted">{footnote}</p>
          ) : null}

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center -space-x-2">
              {DEFAULT_AVATARS.map((src, i) => (
                <span
                  key={src}
                  className="relative inline-block h-8 w-8 overflow-hidden rounded-full ring-2 ring-paper"
                  style={{ zIndex: DEFAULT_AVATARS.length - i }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="fill-current"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span className="font-semibold text-ink">4.9</span>
              <span className="text-ink/60">· loved by 1,200+ restaurants</span>
            </div>
          </div>

          {stats && stats.length > 0 ? (
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-black/5 pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs uppercase tracking-wide text-ink/50">
                    {s.label}
                  </dt>
                  <dd className="mt-1 font-display text-2xl tracking-tight">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* Visual column */}
        <div className="relative md:col-span-6">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-card">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(min-width: 768px) 480px, 100vw"
              className="object-cover"
            />

            {/* Gradient overlay */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            />

            {/* Floating menu card */}
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-card backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg leading-tight tracking-tight">
                    Copper Kitchen
                  </p>
                  <p className="text-xs text-ink/60">Seasonal · Brooklyn</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-paper px-2 py-1 text-xs font-medium text-ink">
                  <Star size={10} className="fill-amber-500 text-amber-500" />
                  4.8
                </div>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {['Starters', 'Mains', 'Drinks'].map((c, i) => (
                  <span
                    key={c}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3 py-1 text-xs',
                      i === 0
                        ? 'bg-ink text-paper'
                        : 'bg-paper text-ink/70'
                    )}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Floating QR card */}
          <div className="absolute -left-4 top-12 hidden -rotate-6 rounded-2xl border border-black/5 bg-white p-3 shadow-card md:block">
            <div className="grid h-24 w-24 place-items-center rounded-lg bg-ink text-paper">
              <QrCode size={56} strokeWidth={1.25} />
            </div>
            <p className="mt-2 text-center text-[10px] font-medium text-ink/60">
              Scan to view
            </p>
          </div>

          {/* Floating "live update" pill */}
          <div className="absolute -right-2 top-6 hidden rotate-3 items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-medium shadow-card md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Live menu updates
          </div>
        </div>
      </div>
    </section>
  );
}
