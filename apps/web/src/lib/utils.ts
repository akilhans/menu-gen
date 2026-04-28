import clsx, { type ClassValue } from 'clsx';

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
