import { Request, Response } from 'express';
import { Restaurant } from '../models/Restaurant';
import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';
import { HttpError } from '../utils/httpError';

type LeanDoc = { _id: unknown; __v?: unknown; [key: string]: unknown };

function leanToDto<T extends LeanDoc>(doc: T): Omit<T, '_id' | '__v'> & { id: string } {
  const { _id, __v: _v, ...rest } = doc;
  return { ...rest, id: String(_id) } as Omit<T, '_id' | '__v'> & { id: string };
}

export async function getPublicMenu(req: Request, res: Response) {
  const slug = req.params.slug.toLowerCase();
  const restaurant = await Restaurant.findOne({ slug }).lean();
  if (!restaurant) throw HttpError.notFound('Menu not found');

  const [categories, items] = await Promise.all([
    Category.find({ restaurant: restaurant._id }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    MenuItem.find({ restaurant: restaurant._id, available: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean(),
  ]);

  const byCategory = new Map<string, typeof items>();
  for (const it of items) {
    const key = String(it.category);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(it);
  }

  const enriched = categories.map((c) => ({
    ...leanToDto(c),
    items: (byCategory.get(String(c._id)) ?? []).map(leanToDto),
  }));

  res.json({ restaurant: leanToDto(restaurant), categories: enriched });
}
