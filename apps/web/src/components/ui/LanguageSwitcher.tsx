'use client';

import { Globe } from 'lucide-react';
import { LOCALES, LOCALE_LABELS, Locale } from '@/i18n/translations';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { locale, setLocale } = useT();
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-black/10 bg-white/70 px-2.5 py-1.5 backdrop-blur hover:bg-white',
        className
      )}
    >
      <Globe size={compact ? 12 : 14} className="text-ink/60" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={cn(
          'cursor-pointer border-none bg-transparent pr-1 focus:outline-none',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
