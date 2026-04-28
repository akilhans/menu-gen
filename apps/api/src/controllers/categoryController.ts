import { Request, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { HttpError } from '../utils/httpError';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

async function requireOwnedRestaurant(userId: string | undefined) {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');
  return restaurant;
}

export async function listCategories(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const categories = await Category.find({ restaurant: restaurant._id }).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ categories });
}

export async function createCategory(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const { name, sortOrder } = req.body as z.infer<typeof createCategorySchema>;
  const count = await Category.countDocuments({ restaurant: restaurant._id });
  const category = await Category.create({
    restaurant: restaurant._id,
    name,
    sortOrder: sortOrder ?? count,
  });
  res.status(201).json({ category });
}

export async function updateCategory(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const category = await Category.findOne({ _id: req.params.id, restaurant: restaurant._id });
  if (!category) throw HttpError.notFound('Category not found');

  const body = req.body as z.infer<typeof updateCategorySchema>;
  if (body.name !== undefined) category.name = body.name;
  if (body.sortOrder !== undefined) category.sortOrder = body.sortOrder;

  await category.save();
  res.json({ category });
}

export async function deleteCategory(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const category = await Category.findOneAndDelete({
    _id: req.params.id,
    restaurant: restaurant._id,
  });
  if (!category) throw HttpError.notFound('Category not found');
  await MenuItem.deleteMany({ category: category._id });
  res.status(204).end();
}
