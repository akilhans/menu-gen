import slugify from 'slugify';
import { Restaurant } from '../models/Restaurant';

export function makeSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

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
