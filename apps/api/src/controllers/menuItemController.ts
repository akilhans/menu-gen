import { Request, Response } from 'express';
import { z } from 'zod';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';
import { Restaurant } from '../models/Restaurant';
import { HttpError } from '../utils/httpError';
import { safeUrl } from '../utils/zod';

const modifierOptionSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(60),
  priceDelta: z.number().finite(),
  available: z.boolean().optional(),
});

const modifierGroupSchema = z
  .object({
    id: z.string().min(1).max(40),
    name: z.string().min(1).max(60),
    selectionType: z.enum(['single', 'multiple']),
    required: z.boolean().optional(),
    min: z.number().int().min(0).max(20).optional(),
    max: z.number().int().min(1).max(20).optional(),
    options: z.array(modifierOptionSchema).min(1).max(20),
  })
  .superRefine((g, ctx) => {
    const min = g.min ?? (g.required ? 1 : 0);
    const max = g.max ?? (g.selectionType === 'single' ? 1 : g.options.length);
    if (max < min) {
      ctx.addIssue({ code: 'custom', message: 'max must be >= min' });
    }
    if (g.selectionType === 'single' && max > 1) {
      ctx.addIssue({ code: 'custom', message: "single-selection groups can't have max > 1" });
    }
    const ids = g.options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'duplicate option ids' });
    }
  });

export const createItemSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  imageUrl: safeUrl().optional().or(z.literal('')),
  available: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  allergens: z.array(z.string().max(30)).max(20).optional(),
  modifierGroups: z.array(modifierGroupSchema).max(10).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateItemSchema = createItemSchema.partial();

type ModifierGroupInput = z.infer<typeof modifierGroupSchema>;

function normalizeModifierGroups(groups: ModifierGroupInput[] | undefined) {
  if (!groups) return [];
  const seenGroupIds = new Set<string>();
  return groups.map((g) => {
    if (seenGroupIds.has(g.id)) {
      throw HttpError.badRequest('Duplicate modifier group id');
    }
    seenGroupIds.add(g.id);
    const required = g.required ?? false;
    const min = g.min ?? (required ? 1 : 0);
    const max = g.max ?? (g.selectionType === 'single' ? 1 : g.options.length);
    return {
      id: g.id,
      name: g.name,
      selectionType: g.selectionType,
      required,
      min,
      max,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        priceDelta: o.priceDelta,
        available: o.available ?? true,
      })),
    };
  });
}

async function requireOwnedRestaurant(userId: string | undefined) {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');
  return restaurant;
}

export async function listItems(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const items = await MenuItem.find({ restaurant: restaurant._id }).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ items });
}

export async function createItem(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const body = req.body as z.infer<typeof createItemSchema>;

  const category = await Category.findOne({ _id: body.category, restaurant: restaurant._id });
  if (!category) throw HttpError.badRequest('Invalid category');

  const count = await MenuItem.countDocuments({ category: category._id });

  const item = await MenuItem.create({
    restaurant: restaurant._id,
    category: category._id,
    name: body.name,
    description: body.description,
    price: body.price,
    imageUrl: body.imageUrl || undefined,
    available: body.available ?? true,
    tags: body.tags ?? [],
    allergens: body.allergens ?? [],
    modifierGroups: normalizeModifierGroups(body.modifierGroups),
    sortOrder: body.sortOrder ?? count,
  });

  res.status(201).json({ item });
}

export async function updateItem(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const item = await MenuItem.findOne({ _id: req.params.id, restaurant: restaurant._id });
  if (!item) throw HttpError.notFound('Item not found');

  const body = req.body as z.infer<typeof updateItemSchema>;

  if (body.category) {
    const cat = await Category.findOne({ _id: body.category, restaurant: restaurant._id });
    if (!cat) throw HttpError.badRequest('Invalid category');
    item.category = cat._id;
  }
  const simpleKeys = ['name', 'description', 'price', 'available', 'tags', 'allergens', 'sortOrder'] as const;
  const itemRecord = item as unknown as Record<string, unknown>;
  for (const key of simpleKeys) {
    if (body[key] !== undefined) {
      itemRecord[key] = body[key];
    }
  }
  if (body.imageUrl !== undefined) item.imageUrl = body.imageUrl || undefined;
  if (body.modifierGroups !== undefined) {
    item.modifierGroups = normalizeModifierGroups(body.modifierGroups) as typeof item.modifierGroups;
  }

  await item.save();
  res.json({ item });
}

export async function deleteItem(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
  if (!item) throw HttpError.notFound('Item not found');
  res.status(204).end();
}
