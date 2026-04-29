import clsx, { type ClassValue } from 'clsx';

/**
 * Conditional className joiner. Pass any combination of strings, arrays, and
 * `{ "class": condition }` objects; falsy values drop out.
 *
 * @example
 *   cn('btn', isActive && 'btn-active', { 'btn-lg': size === 'lg' })
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const CURRENCY_OVERRIDES: Record<
  string,
  { symbol: string; position: 'before' | 'after'; locale: string; maxFrac: number }
> = {
  UZS: { symbol: "so'm", position: 'after', locale: 'ru-RU', maxFrac: 0 },
  RUB: { symbol: '₽', position: 'after', locale: 'ru-RU', maxFrac: 0 },
  KZT: { symbol: '₸', position: 'after', locale: 'ru-RU', maxFrac: 0 },
  KGS: { symbol: 'с', position: 'after', locale: 'ru-RU', maxFrac: 0 },
};

/**
 * Format a price for display.
 *
 * Uses currency-specific overrides for ru-locale currencies (UZS, RUB, KZT,
 * KGS) where Intl's defaults look unnatural. Falls back to `Intl.NumberFormat`
 * for ISO-4217 codes.
 *
 * @param amount   numeric amount (already in major units, e.g. dollars)
 * @param currency 3-letter ISO 4217 code; defaults to USD
 *
 * @returns localized string with the currency symbol/code
 *
 * @example
 *   formatPrice(12.5, 'USD')  // "$12.50"
 *   formatPrice(15000, 'UZS') // "15 000 so'm"
 *
 * Caveat: never use the returned string in arithmetic. The amount-in-minor-
 * units convention (cents) is **not** applied — pass major units directly.
 */
export function formatPrice(amount: number, currency = 'USD') {
  const code = (currency || 'USD').toUpperCase();
  const override = CURRENCY_OVERRIDES[code];
  if (override) {
    const formatted = new Intl.NumberFormat(override.locale, {
      maximumFractionDigits: override.maxFrac,
      minimumFractionDigits: 0,
    }).format(amount);
    return override.position === 'after'
      ? `${formatted} ${override.symbol}`
      : `${override.symbol}${formatted}`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}
