/**
 * Tiny, allocation-free in-memory search.
 *
 * The original `CustomerMenu` filtered like this on every keystroke:
 *
 *   items.filter(i =>
 *     i.name.toLowerCase().includes(q) ||
 *     i.description?.toLowerCase().includes(q) ||
 *     i.tags.some(t => t.toLowerCase().includes(q))
 *   )
 *
 * That re-lowercases every field on every keystroke. For N items, T tags each:
 *   Time:  O(N · (L_name + L_desc + T · L_tag)) per keystroke
 *   Space: O(N) for the filtered array (unavoidable)
 *
 * `buildSearchIndex` lowercases each item once and joins relevant fields into a
 * single haystack string. `searchIndex` then does one substring check per item:
 *   Build:  O(N · (L_name + L_desc + T · L_tag))   — once per dataset change
 *   Query:  O(N · L_query) — but in practice ~N comparisons against a
 *           pre-lowercased buffer (V8 optimizes this aggressively).
 */

export type SearchFn<T> = (query: string) => T[];

export interface SearchIndex<T> {
  /** Returns matching items in original order. Empty query returns all items. */
  search: SearchFn<T>;
}

export function buildSearchIndex<T>(
  items: readonly T[],
  fields: ReadonlyArray<(item: T) => string | undefined | null | ReadonlyArray<string>>
): SearchIndex<T> {
  const haystacks: string[] = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    let buf = '';
    for (const f of fields) {
      const v = f(items[i]);
      if (v == null) continue;
      if (Array.isArray(v)) {
        for (const s of v) {
          if (typeof s === 'string') buf += ' ' + s;
        }
      } else if (typeof v === 'string') {
        buf += ' ' + v;
      }
    }
    haystacks[i] = buf.toLowerCase();
  }

  return {
    search(query: string) {
      const q = query.trim().toLowerCase();
      if (!q) return items.slice();
      const out: T[] = [];
      for (let i = 0; i < items.length; i++) {
        if (haystacks[i].includes(q)) out.push(items[i]);
      }
      return out;
    },
  };
}

/**
 * Group items by a key, building a `Map<key, total>`.
 * Replaces patterns like `array.filter(...).reduce(sum)` called inside a
 * render loop, which is O(N²).
 *
 * Time/Space: O(N).
 *
 * @example
 *   const totals = sumBy(cartLines, l => l.menuItemId, l => l.quantity);
 *   totals.get(item.id) // O(1)
 */
export function sumBy<T, K>(
  items: readonly T[],
  keyOf: (item: T) => K,
  valueOf: (item: T) => number
): Map<K, number> {
  const out = new Map<K, number>();
  for (let i = 0; i < items.length; i++) {
    const k = keyOf(items[i]);
    out.set(k, (out.get(k) ?? 0) + valueOf(items[i]));
  }
  return out;
}
