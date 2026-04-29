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

type SumDoc = { _id: null | number | string; count: number; revenue: number };
type StatusDoc = { _id: string; count: number };
type TopItemDoc = { name: string; quantity: number; revenue: number };
type PrepTimeDoc = { _id: null; avgMs: number };

function bucketSum(docs: SumDoc[]): { orders: number; revenue: number; averageOrderValue: number } {
  const orders = docs.reduce((s, d) => s + d.count, 0);
  const revenue = docs.reduce((s, d) => s + d.revenue, 0);
  return {
    orders,
    revenue,
    averageOrderValue: orders > 0 ? revenue / orders : 0,
  };
}

/**
 * Aggregate dashboard stats in a single roundtrip via `$facet`.
 *
 * Indexes used:
 *   - { restaurant: 1, createdAt: -1 } (existing) — outer $match
 *   - { restaurant: 1, status: 1, createdAt: -1 } (added) — status sub-pipes
 */
export async function getOrderStats(req: Request, res: Response) {
  const restaurant = await requireOwnedRestaurant(req.userId);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now);
  startOfMonth.setDate(startOfMonth.getDate() - 30);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfDailySeries = new Date(now);
  startOfDailySeries.setDate(startOfDailySeries.getDate() - 13);
  startOfDailySeries.setHours(0, 0, 0, 0);

  const restaurantId = restaurant._id;

  // One $facet does the time-bound work. A separate small all-time aggregation
  // handles topItems + statusCounts + pending so the facet input stays small
  // (last 30 days) and the index plan stays fast.
  const [timeBound, [statusAgg, topItems, prepTimeAgg]] = await Promise.all([
    Order.aggregate<{
      today: SumDoc[];
      week: SumDoc[];
      month: SumDoc[];
      hourly: { _id: number; count: number; revenue: number }[];
      daily: { _id: string; count: number; revenue: number }[];
    }>([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: startOfDailySeries },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$subtotal' } } },
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$subtotal' } } },
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$subtotal' } } },
          ],
          hourly: [
            { $match: { createdAt: { $gte: startOfToday } } },
            {
              $group: {
                _id: { $hour: '$createdAt' },
                count: { $sum: 1 },
                revenue: { $sum: '$subtotal' },
              },
            },
          ],
          daily: [
            {
              $group: {
                _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
                count: { $sum: 1 },
                revenue: { $sum: '$subtotal' },
              },
            },
          ],
        },
      },
    ]),
    Promise.all([
      Order.aggregate<StatusDoc>([
        { $match: { restaurant: restaurantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate<TopItemDoc>([
        { $match: { restaurant: restaurantId, status: { $ne: 'cancelled' } } },
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
      Order.aggregate<PrepTimeDoc>([
        {
          $match: {
            restaurant: restaurantId,
            status: { $in: ['ready', 'completed'] },
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            avgMs: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } },
          },
        },
      ]),
    ]),
  ]);

  const facet = timeBound[0] ?? { today: [], week: [], month: [], hourly: [], daily: [] };

  const today = bucketSum(facet.today);
  const week = bucketSum(facet.week);
  const month = bucketSum(facet.month);

  // Build dense 24-bucket array (00..23) — fill zeros so the chart renders cleanly.
  const hourlyMap = new Map(facet.hourly.map((h) => [h._id, h]));
  const hourlyToday = Array.from({ length: 24 }, (_, hour) => {
    const base = new Date(startOfToday);
    base.setHours(hour, 0, 0, 0);
    const h = hourlyMap.get(hour);
    return {
      at: base.toISOString(),
      orders: h?.count ?? 0,
      revenue: h?.revenue ?? 0,
    };
  });

  // Build dense 14-day series.
  const dailyMap = new Map(facet.daily.map((d) => [d._id, d]));
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startOfDailySeries);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const row = dailyMap.get(key);
    return {
      at: d.toISOString(),
      orders: row?.count ?? 0,
      revenue: row?.revenue ?? 0,
    };
  });

  const statusCounts = {
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const row of statusAgg) {
    if (row._id in statusCounts) {
      (statusCounts as Record<string, number>)[row._id] = row.count;
    }
  }

  const avgPrepTimeMinutes = prepTimeAgg[0]?.avgMs ? prepTimeAgg[0].avgMs / 60000 : null;

  res.json({
    stats: {
      today,
      thisWeek: { ...week },
      thisMonth: { ...month },
      pending: statusCounts.pending,
      statusCounts,
      hourlyToday,
      daily,
      topItems,
      avgPrepTimeMinutes,
    },
  });
}
