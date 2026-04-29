import slugify from 'slugify';
import { Restaurant } from '../models/Restaurant';

/**
 * Pure string→slug. Lowercases, trims, removes non-`[a-z0-9-]` characters,
 * collapses runs of `-`. Empty input returns `''` — callers should default
 * to `'restaurant'` or similar.
 */
export function makeSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

/**
 * Same as `makeSlug` but resolves collisions against the Restaurants
 * collection by appending `-2`, `-3`, ... until the slug is unique.
 *
 * @param input    user-provided string (e.g. restaurant name)
 * @param ignoreId optional ObjectId of a restaurant to exclude from the
 *                 collision check (used by PATCH /api/restaurant/me when
 *                 the slug isn't actually changing).
 *
 * Caveat: this issues one DB roundtrip per attempted candidate. For
 * realistic inputs the loop terminates in 1–2 attempts; for adversarial
 * inputs that share a popular slug, consider rate-limiting at the route.
 */
export async function uniqueSlug(input: string, ignoreId?: string): Promise<string> {
  const base = makeSlug(input) || 'restaurant';
  let candidate = base;
  let i = 1;
  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (ignoreId) query._id = { $ne: ignoreId };
    const exists = await Restaurant.exists(query);
    if (!exists) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}
