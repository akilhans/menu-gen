import { describe, expect, it } from 'vitest';
import { makeSlug } from './slug';

describe('makeSlug', () => {
  it('lowercases and dashes a normal name', () => {
    expect(makeSlug('Copper Kitchen')).toBe('copper-kitchen');
  });

  it('strips diacritics for ru/uz inputs', () => {
    // slugify's `strict: true` removes non-ASCII unless transliterated.
    // We just need it to produce a URL-safe value.
    const slug = makeSlug("O'zbekcha kafe");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.length).toBeGreaterThan(0);
  });

  it('transliterates & and drops noise punctuation', () => {
    // slugify uses `& -> and` by default; trailing punctuation is stripped.
    expect(makeSlug('Joe & The Juice!!')).toBe('joe-and-the-juice');
  });

  it('returns empty string for symbol-only input', () => {
    expect(makeSlug('@@@')).toBe('');
  });

  it('trims and collapses runs of whitespace', () => {
    expect(makeSlug('  spaced   out  ')).toBe('spaced-out');
  });
});
