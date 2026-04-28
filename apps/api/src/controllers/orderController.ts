import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { Order, ORDER_STATUSES } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { MenuItem, IMenuItem } from '../models/MenuItem';
import { HttpError } from '../utils/httpError';

interface ModifierInput {
  groupId: string;
  optionId: string;
}

function resolveModifiers(item: IMenuItem, picks: ModifierInput[]) {
  const groups = item.modifierGroups ?? [];
  const picksByGroup = new Map<string, string[]>();
  for (const p of picks) {
    const list = picksByGroup.get(p.groupId) ?? [];
    list.push(p.optionId);
    picksByGroup.set(p.groupId, list);
  }

  // Reject selections that don't reference a real group on this item.
  for (const groupId of picksByGroup.keys()) {
    if (!groups.find((g) => g.id === groupId)) {
      throw HttpError.badRequest(`Unknown modifier group for "${item.name}"`);
    }
  }

  const selectedModifiers: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    optionName: string;
    priceDelta: number;
  }> = [];
  let priceDeltaSum = 0;

  for (const group of groups) {
    const chosen = picksByGroup.get(group.id) ?? [];
    if (chosen.length < group.min) {
      throw HttpError.badRequest(`"${group.name}" requires at least ${group.min} selection(s)`);
    }
    if (chosen.length > group.max) {
      throw HttpError.badRequest(`"${group.name}" allows at most ${group.max} selection(s)`);
    }
    if (group.selectionType === 'single' && chosen.length > 1) {
      throw HttpError.badRequest(`"${group.name}" only allows one selection`);
    }
    if (new Set(chosen).size !== chosen.length) {
      throw HttpError.badRequest(`Duplicate option in "${group.name}"`);
    }
    for (const optionId of chosen) {
      const option = group.options.find((o) => o.id === optionId);
      if (!option) {
        throw HttpError.badRequest(`Unknown option in "${group.name}"`);
      }
      if (!option.available) {
        throw HttpError.badRequest(`Unavailable: ${option.name}`);
      }
      selectedModifiers.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDelta: option.priceDelta,
      });
      priceDeltaSum += option.priceDelta;
    }
  }

  const unitPrice = Math.max(0, item.price + priceDeltaSum);
  return { selectedModifiers, unitPrice };
}

// ---------- Public: create order ----------
const selectedModifierInputSchema = z.object({
  groupId: z.string().min(1).max(40),
  optionId: z.string().min(1).max(40),
});

export const createOrderSchema = z.object({
  restaurantSlug: z.string().min(1).max(60),
  table: z.string().min(1).max(20).trim(),
  items: z
    .array(
      z.object({
        menuItem: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        notes: z.string().max(240).optional(),
        selectedModifiers: z.array(selectedModifierInputSchema).max(50).optional(),
      })
    )
    .min(1)
    .max(50),
  customerNote: z.string().max(500).optional(),
});

export async function createOrder(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createOrderSchema>;
  const restaurant = await Restaurant.findOne({
    slug: body.restaurantSlug.toLowerCase(),
  });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');

  const itemIds = body.items
    .map((i) => i.menuItem)
    .filter((id) => Types.ObjectId.isValid(id));
  if (itemIds.length !== body.items.length) {
    throw HttpError.badRequest('Invalid menu item id');
  }

  const menuItems = await MenuItem.find({
    _id: { $in: itemIds },
    restaurant: restaurant._id,
  });
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  const orderItems = body.items.map((line) => {
    const mi = byId.get(line.menuItem);
    if (!mi) throw HttpError.badRequest(`Menu item not found: ${line.menuItem}`);
    if (!mi.available) throw HttpError.badRequest(`Unavailable: ${mi.name}`);

    const { selectedModifiers, unitPrice } = resolveModifiers(mi, line.selectedModifiers ?? []);

    return {
      menuItem: mi._id,
      name: mi.name,
      price: unitPrice,
      quantity: line.quantity,
      notes: line.notes,
      selectedModifiers,
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    restaurant: restaurant._id,
    table: body.table,
    items: orderItems,
    subtotal,
    customerNote: body.customerNote,
  });

  res.status(201).json({ order });
}

// ---------- Private: list orders ----------
async function requireOwnedRestaurant(userId: string | undefined) {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');
  return restaurant;
}

export async function listOrders(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const query: Record<string, unknown> = { restaurant: restaurant._id };
  if (status && status !== 'all' && ORDER_STATUSES.includes(status as never)) {
    query.status = status;
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit);
  res.json({ orders });
}

// ---------- Private: update status ----------
export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES as [string, ...string[]]),
});

export async function updateOrderStatus(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);
  const { status } = req.body as z.infer<typeof updateOrderSchema>;
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, restaurant: restaurant._id },
    { status },
    { new: true }
  );
  if (!order) throw HttpError.notFound('Order not found');
  res.json({ order });
}

// ---------- Private: stats ----------
export async function getOrderStats(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  type Agg = { count: number; revenue: number };
  const groupByNone = {
    _id: null,
    count: { $sum: 1 },
    revenue: { $sum: '$subtotal' },
  };

  const [todayAgg, weekAgg, pendingCount, topItems] = await Promise.all([
    Order.aggregate<Agg>([
      {
        $match: {
          restaurant: restaurant._id,
          createdAt: { $gte: startOfToday },
          status: { $ne: 'cancelled' },
        },
      },
      { $group: groupByNone },
    ]),
    Order.aggregate<Agg>([
      {
        $match: {
          restaurant: restaurant._id,
          createdAt: { $gte: startOfWeek },
          status: { $ne: 'cancelled' },
        },
      },
      { $group: groupByNone },
    ]),
    Order.countDocuments({ restaurant: restaurant._id, status: 'pending' }),
    Order.aggregate<{ name: string; quantity: number; revenue: number }>([
      {
        $match: {
          restaurant: restaurant._id,
          status: { $ne: 'cancelled' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: '$_id', quantity: 1, revenue: 1 } },
    ]),
  ]);

  const today = todayAgg[0] ?? { count: 0, revenue: 0 };
  const week = weekAgg[0] ?? { count: 0, revenue: 0 };

  res.json({
    stats: {
      today: {
        orders: today.count,
        revenue: today.revenue,
        averageOrderValue: today.count > 0 ? today.revenue / today.count : 0,
      },
      pending: pendingCount,
      thisWeek: {
        orders: week.count,
        revenue: week.revenue,
      },
      topItems,
    },
  });
}
