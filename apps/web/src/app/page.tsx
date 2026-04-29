'use client';

import { LayoutDashboard, QrCode, Smartphone } from 'lucide-react';
import { useT } from '@/i18n/I18nProvider';
import { Features } from '@/components/landing/Features';
import { FinalCta } from '@/components/landing/FinalCta';
import { Hero } from '@/components/landing/Hero';
import { Nav } from '@/components/landing/Nav';

export default function LandingPage() {
  const { t } = useT();

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Nav
        links={[
          { href: '#features', label: t('nav.features') },
          { href: '#how', label: t('nav.howItWorks') },
          { href: '#pricing', label: t('nav.pricing') },
        ]}
        loginLabel={t('nav.login')}
        signupLabel={t('nav.signup')}
      />

      <Hero
        badge={t('landing.tagline')}
        headingPre={t('landing.hero.pre')}
        headingAccent={t('landing.hero.accent')}
        headingPost={t('landing.hero.post')}
        description={t('landing.description')}
        primaryCta={{ label: t('landing.cta.free'), href: '/register' }}
        secondaryCta={{ label: t('landing.cta.demo'), href: '/menu/copper-kitchen' }}
        footnote={t('landing.cta.noCard')}
        imageSrc="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80"
        imageAlt="A guest scanning a QR menu in a restaurant"
        stats={[
          { value: '2 min', label: 'Setup' },
          { value: '60+', label: 'Countries' },
          { value: '99.9%', label: 'Uptime' },
        ]}
      />

      <Features
        title={t('landing.features.title')}
        subtitle={t('landing.features.subtitle')}
        items={[
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
        ]}
      />

      <FinalCta
        title={t('landing.finalCta.title')}
        description={t('landing.finalCta.desc')}
        ctaLabel={t('landing.cta.free')}
        ctaHref="/register"
      />

      <footer className="mx-auto max-w-6xl px-5 pb-10 text-xs text-ink-muted">
        © {new Date().getFullYear()} menu-gen
      </footer>
    </main>
  );
}
