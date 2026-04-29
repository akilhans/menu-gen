import { Request, Response } from 'express';
import { z } from 'zod';
import { Restaurant } from '../models/Restaurant';
import { HttpError } from '../utils/httpError';
import { uniqueSlug } from '../utils/slug';
import { safeUrl } from '../utils/zod';

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  logoUrl: safeUrl().optional().or(z.literal('')),
  coverUrl: safeUrl().optional().or(z.literal('')),
  currency: z.string().length(3).optional(),
  themeColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/)
    .optional(),
  address: z.string().max(240).optional(),
  phone: z.string().max(40).optional(),
  instagram: z.string().max(80).optional(),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function getMyRestaurant(req: Request, res: Response) {
  const restaurant = await Restaurant.findOne({ owner: req.userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');
  res.json({ restaurant });
}

export async function updateMyRestaurant(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateRestaurantSchema>;
  const restaurant = await Restaurant.findOne({ owner: req.userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');

  if (body.slug && body.slug !== restaurant.slug) {
    restaurant.slug = await uniqueSlug(body.slug, String(restaurant._id));
  }

  const assignable = ([
    'name',
    'description',
    'logoUrl',
    'coverUrl',
    'currency',
    'themeColor',
    'address',
    'phone',
    'instagram',
  ] as const).filter((k) => body[k] !== undefined);

  const restaurantRecord = restaurant as unknown as Record<string, unknown>;
  for (const key of assignable) {
    restaurantRecord[key] = body[key];
  }

  await restaurant.save();
  res.json({ restaurant });
}
