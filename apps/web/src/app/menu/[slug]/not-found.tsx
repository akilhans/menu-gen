'use client';

import Link from 'next/link';
import { useT } from '@/i18n/I18nProvider';

export default function NotFound() {
  const { t } = useT();
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('err.menuNotFound')}</h1>
        <p className="mt-2 text-sm text-ink/60">{t('err.menuNotFoundDesc')}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft"
        >
          {t('err.goHome')}
        </Link>
      </div>
    </main>
  );
}
