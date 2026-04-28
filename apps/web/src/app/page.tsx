'use client';

import Link from 'next/link';
import { ArrowRight, QrCode, Sparkles, Smartphone, LayoutDashboard } from 'lucide-react';
import { useT } from '@/i18n/I18nProvider';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function LandingPage() {
  const { t } = useT();

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 md:pt-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper">
            <QrCode size={16} />
          </div>
          <span className="font-semibold tracking-tight">menu-gen</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-ink/70 md:flex">
          <a href="#features" className="hover:text-ink">
            {t('nav.features')}
          </a>
          <a href="#how" className="hover:text-ink">
            {t('nav.howItWorks')}
          </a>
          <a href="#pricing" className="hover:text-ink">
            {t('nav.pricing')}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:text-ink md:inline-flex"
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
          >
            {t('nav.signup')} <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-14 md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-ink/70 backdrop-blur">
              <Sparkles size={12} /> {t('landing.tagline')}
            </div>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              {t('landing.hero.pre')}
              <br />
              <span className="italic text-brand">{t('landing.hero.accent')}</span>{' '}
              {t('landing.hero.post')}
            </h1>
            <p className="mt-5 max-w-md text-ink/70 md:text-lg">{t('landing.description')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-medium text-paper hover:bg-ink-soft"
              >
                {t('landing.cta.free')} <ArrowRight size={16} />
              </Link>
              <Link
                href="/menu/copper-kitchen"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-6 text-sm font-medium hover:bg-black/5"
              >
                {t('landing.cta.demo')}
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-muted">{t('landing.cta.noCard')}</p>
          </div>

          {/* Phone mock */}
          <div className="relative flex items-center justify-center">
            <div className="relative h-[560px] w-[280px] rounded-[40px] border-[10px] border-ink bg-paper shadow-card md:h-[620px] md:w-[300px]">
              <div className="absolute left-1/2 top-2.5 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
              <div className="h-full w-full overflow-hidden rounded-[30px] bg-paper">
                <div className="relative h-44 w-full bg-gradient-to-br from-brand to-red-400" />
                <div className="-mt-10 px-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-2xl tracking-tight">Copper Kitchen</h3>
                      <p className="text-xs text-ink/60">Seasonal · Brooklyn, NY</p>
                    </div>
                    <div className="h-14 w-14 rounded-full border-2 border-paper bg-white shadow-card" />
                  </div>
                  <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
                    {['Starters', 'Mains', 'Drinks', 'Desserts'].map((c, i) => (
                      <span
                        key={c}
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                          i === 0 ? 'bg-ink text-paper' : 'bg-white text-ink/70'
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      ['Burrata Toast', '$14', 'Heirloom tomato, basil oil'],
                      ['Shishito Peppers', '$9', 'Flaked salt, chili crisp'],
                      ['Smash Burger', '$18', 'Aged cheddar, fries'],
                    ].map(([name, price, desc]) => (
                      <div
                        key={name}
                        className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 shadow-soft"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{name}</p>
                          <p className="truncate text-xs text-ink/60">{desc}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">{price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating QR */}
            <div className="absolute -right-4 top-16 hidden rotate-6 rounded-2xl border border-black/5 bg-white p-3 shadow-card md:block">
              <div
                className="h-24 w-24 rounded-lg"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #0E0E10 25%, transparent 25%),linear-gradient(-45deg, #0E0E10 25%, transparent 25%),linear-gradient(45deg, transparent 75%, #0E0E10 75%),linear-gradient(-45deg, transparent 75%, #0E0E10 75%)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
                }}
              />
              <p className="mt-2 text-center text-[10px] text-ink/60">Scan to open</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-tight md:text-5xl">
            {t('landing.features.title')}
          </h2>
          <p className="hidden max-w-xs text-sm text-ink/60 md:block">
            {t('landing.features.subtitle')}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: <LayoutDashboard size={20} />,
              title: t('landing.feat.dashboard.title'),
              desc: t('landing.feat.dashboard.desc'),
            },
            {
              icon: <QrCode size={20} />,
              title: t('landing.feat.qr.title'),
              desc: t('landing.feat.qr.desc'),
            },
            {
              icon: <Smartphone size={20} />,
              title: t('landing.feat.mobile.title'),
              desc: t('landing.feat.mobile.desc'),
            },
          ].map((f) => (
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

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-paper md:p-16">
          <div className="relative z-10 max-w-xl">
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">
              {t('landing.finalCta.title')}
            </h2>
            <p className="mt-4 text-paper/70">{t('landing.finalCta.desc')}</p>
            <Link
              href="/register"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-medium text-white hover:opacity-90"
            >
              {t('landing.cta.free')} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-brand/20 blur-3xl" />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 pb-10 text-xs text-ink-muted">
        © {new Date().getFullYear()} menu-gen
      </footer>
    </main>
  );
}
