'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  DollarSign,
  Flame,
  Hash,
  Receipt,
  RefreshCw,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import type { Order, OrderStats, OrderStatus, Restaurant } from '@menu-gen/shared';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { formatPrice, cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nProvider';

const STATUS_FILTERS: Array<OrderStatus | 'all'> = [
  'all',
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const STATUS_STYLE: Record<OrderStatus, { bg: string; fg: string; ring: string }> = {
  pending: { bg: 'bg-amber-50', fg: 'text-amber-700', ring: 'ring-amber-200' },
  preparing: { bg: 'bg-blue-50', fg: 'text-blue-700', ring: 'ring-blue-200' },
  ready: { bg: 'bg-emerald-50', fg: 'text-emerald-700', ring: 'ring-emerald-200' },
  completed: { bg: 'bg-ink', fg: 'text-paper', ring: 'ring-ink/20' },
  cancelled: { bg: 'bg-black/5', fg: 'text-ink/50', ring: 'ring-black/10' },
};

const POLL_INTERVAL = 8000;

export default function OrdersPage() {
  const { t } = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currency = restaurant?.currency ?? 'USD';

  async function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setRefreshing(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.listOrders(filter),
        api.getOrderStats(),
      ]);
      setOrders(ordersRes.orders);
      setStats(statsRes.stats);
      setLastUpdated(new Date());
    } catch (err) {
      if (!opts.silent) toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    api.getMyRestaurant().then(({ restaurant }) => setRestaurant(restaurant));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load({ silent: true }), POLL_INTERVAL);
    const onVis = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const { order } = await api.updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
      await load({ silent: true }); // refresh stats
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/50">{t('orders.section')}</p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            {t('orders.title')}
          </h1>
          {lastUpdated && (
            <p className="mt-1 text-xs text-ink/40">
              {t('orders.updated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
        >
          <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
          {t('orders.refresh')}
        </button>
      </header>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('orders.stats.today')}
          value={stats?.today.orders ?? 0}
          icon={<Receipt size={14} />}
        />
        <StatCard
          label={t('orders.stats.revenue')}
          value={formatPrice(stats?.today.revenue ?? 0, currency)}
          icon={<DollarSign size={14} />}
          strong
        />
        <StatCard
          label={t('orders.stats.pending')}
          value={stats?.pending ?? 0}
          icon={<Flame size={14} />}
          tone={stats && stats.pending > 0 ? 'alert' : undefined}
        />
        <StatCard
          label={t('orders.stats.avgOrder')}
          value={formatPrice(stats?.today.averageOrderValue ?? 0, currency)}
          icon={<TrendingUp size={14} />}
        />
      </div>

      {/* Top items */}
      {stats && stats.topItems.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
            <Trophy size={14} /> {t('orders.stats.topItems')}
          </div>
          <div className="flex flex-col gap-2">
            {stats.topItems.map((it, idx) => (
              <div
                key={it.name}
                className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black/5 text-xs font-mono text-ink/60">
                    {idx + 1}
                  </span>
                  <span className="truncate text-sm font-medium">{it.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-ink/60">
                  <span>× {it.quantity}</span>
                  <span className="font-medium text-ink">{formatPrice(it.revenue, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {STATUS_FILTERS.map((s) => {
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                active ? 'bg-ink text-paper' : 'bg-black/5 text-ink/70 hover:bg-black/10'
              )}
            >
              {s === 'all' ? t('orders.filter.all') : t(`orders.status.${s}`)}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-black/5" />
      ) : orders.length === 0 ? (
        <Card className="grid place-items-center py-14 text-center">
          <Receipt size={28} className="mb-3 text-ink/30" />
          <p className="text-sm text-ink/50">{t('orders.empty')}</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence initial={false}>
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                currency={currency}
                onStatus={updateStatus}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  strong,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  strong?: boolean;
  tone?: 'alert';
}) {
  return (
    <Card className={cn('relative overflow-hidden', tone === 'alert' && 'ring-1 ring-amber-200')}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/60">{label}</p>
        <div
          className={cn(
            'grid h-7 w-7 place-items-center rounded-lg',
            tone === 'alert' ? 'bg-amber-50 text-amber-700' : 'bg-black/5 text-ink/70'
          )}
        >
          {icon}
        </div>
      </div>
      <p
        className={cn(
          'mt-2 font-display tracking-tight',
          strong ? 'text-3xl' : 'text-3xl'
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function OrderRow({
  order,
  currency,
  onStatus,
}: {
  order: Order;
  currency: string;
  onStatus: (id: string, status: OrderStatus) => void;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLE[order.status];
  const ref = order.id.slice(-6).toUpperCase();
  const ageMin = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

  const nextActions: Array<{ label: string; status: OrderStatus; variant?: 'primary' | 'danger' | 'ghost' }> = useMemo(() => {
    switch (order.status) {
      case 'pending':
        return [
          { label: t('orders.markPreparing'), status: 'preparing', variant: 'primary' },
          { label: t('orders.cancel'), status: 'cancelled', variant: 'danger' },
        ];
      case 'preparing':
        return [{ label: t('orders.markReady'), status: 'ready', variant: 'primary' }];
      case 'ready':
        return [{ label: t('orders.markCompleted'), status: 'completed', variant: 'primary' }];
      case 'completed':
      case 'cancelled':
        return [{ label: t('orders.reopen'), status: 'preparing', variant: 'ghost' }];
      default:
        return [];
    }
  }, [order.status, t]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-2xl border border-black/5 bg-white p-4 shadow-soft md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight">
            {t('orders.table', { table: order.table })}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1',
              style.bg,
              style.fg,
              style.ring
            )}
          >
            {t(`orders.status.${order.status}`)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-mono text-[11px] text-ink/60">
            <Hash size={10} /> {ref}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] text-ink/60">
            <Clock size={10} /> {ageMin}m
          </span>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold tracking-tight">
            {formatPrice(order.subtotal, currency)}
          </p>
          <p className="text-[11px] text-ink/50">
            {totalQty} × {order.items.length} items
          </p>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm text-ink/70 transition-colors hover:bg-black/5"
      >
        <span className="truncate">
          {order.items
            .slice(0, 3)
            .map((i) => `${i.quantity}× ${i.name}`)
            .join(' · ')}
          {order.items.length > 3 && ` · +${order.items.length - 3}`}
        </span>
        <span className="ml-2 text-xs text-ink/40">{expanded ? '–' : '+'}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3 py-1">
                  <span className="min-w-0">
                    <span className="font-mono text-xs text-ink/50">{it.quantity}×</span>{' '}
                    <span className="font-medium">{it.name}</span>
                    {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                      <span className="block pl-5 text-[11px] text-ink/55">
                        {it.selectedModifiers.map((m) => m.optionName).join(' · ')}
                      </span>
                    )}
                    {it.notes && <span className="block pl-5 text-ink/50">— {it.notes}</span>}
                  </span>
                  <span className="shrink-0 text-ink/60">
                    {formatPrice(it.price * it.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>
            {order.customerNote && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                “{order.customerNote}”
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {nextActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {nextActions.map((a) => (
            <button
              key={a.status + a.label}
              onClick={() => onStatus(order.id, a.status)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors',
                a.variant === 'primary' && 'bg-ink text-paper hover:bg-ink-soft',
                a.variant === 'danger' && 'bg-red-50 text-red-600 hover:bg-red-100',
                a.variant === 'ghost' && 'bg-black/5 text-ink/70 hover:bg-black/10'
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </motion.article>
  );
}
