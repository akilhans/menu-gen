import { describe, expect, it } from 'vitest';
import { buildSearchIndex, sumBy } from './search';

interface Item {
  id: string;
  name: string;
  description?: string;
  tags: string[];
}

const items: Item[] = [
  { id: 'a', name: 'Margherita pizza', description: 'Classic tomato + basil', tags: ['vegetarian'] },
  { id: 'b', name: 'Pepperoni', description: 'Cured pork sausage', tags: ['spicy'] },
  { id: 'c', name: 'Caesar salad', tags: ['vegetarian', 'gluten'] },
  { id: 'd', name: 'Cola', tags: [] },
];

describe('buildSearchIndex', () => {
  const index = buildSearchIndex<Item>(items, [
    (i) => i.name,
    (i) => i.description ?? '',
    (i) => i.tags,
  ]);

  it('returns all items for empty query', () => {
    expect(index.search('').map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('matches name case-insensitively', () => {
    expect(index.search('PIZZA').map((i) => i.id)).toEqual(['a']);
  });

  it('matches description', () => {
    expect(index.search('basil').map((i) => i.id)).toEqual(['a']);
  });

  it('matches tag entries', () => {
    expect(index.search('vegetarian').map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('preserves original order in matches', () => {
    expect(index.search('a').length).toBeGreaterThan(0);
    const matched = index.search('a').map((i) => i.id);
    expect(matched).toEqual(items.filter((i) => matched.includes(i.id)).map((i) => i.id));
  });

  it('returns empty array on no match', () => {
    expect(index.search('zzz')).toEqual([]);
  });

  it('whitespace-only query is treated as empty', () => {
    expect(index.search('   ').map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('sumBy', () => {
  it('sums values grouped by key', () => {
    const totals = sumBy(
      [
        { id: 'a', q: 1 },
        { id: 'b', q: 5 },
        { id: 'a', q: 2 },
      ],
      (l) => l.id,
      (l) => l.q
    );
    expect(totals.get('a')).toBe(3);
    expect(totals.get('b')).toBe(5);
    expect(totals.get('c')).toBeUndefined();
  });

  it('handles empty input', () => {
    expect(sumBy([], () => 'x', () => 1).size).toBe(0);
  });
});
