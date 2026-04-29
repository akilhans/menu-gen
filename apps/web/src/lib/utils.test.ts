import { describe, expect, it } from 'vitest';
import { cn, formatPrice } from './utils';

describe('cn', () => {
  it('joins truthy classes', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 0, '')).toBe('a');
  });

  it('supports object form', () => {
    expect(cn('btn', { 'btn-active': true, 'btn-lg': false })).toBe('btn btn-active');
  });
});

describe('formatPrice', () => {
  it('formats USD with cents', () => {
    expect(formatPrice(12.5, 'USD')).toMatch(/12\.50/);
  });

  it('formats UZS with so\'m suffix and no fractions', () => {
    expect(formatPrice(15000, 'UZS')).toMatch(/15.000.*so'm/);
  });

  it('formats RUB with ruble suffix', () => {
    expect(formatPrice(500, 'RUB')).toContain('₽');
  });

  it('falls back gracefully on unknown currency', () => {
    const out = formatPrice(99, 'ZZZ');
    expect(out).toContain('99');
  });

  it('defaults to USD when currency missing', () => {
    expect(formatPrice(1)).toMatch(/1\.00/);
  });
});
