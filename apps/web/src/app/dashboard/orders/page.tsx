'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  Download,
  Flame,
  Hash,
  Receipt,
  RefreshCw,
  Timer,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react';
import type {
  Order,
  OrderStats,
  OrderStatsBucket,
  OrderStatus,
  Restaurant,
} from '@menu-gen/shared';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/dashboard/charts/Sparkline';
import { HourlyHeatmap } from '@/components/dashboard/charts/HourlyHeatmap';
import { BarStrip } from '@/components/dashboard/charts/BarStrip';
import { downloadCsv, toCsv } from '@/lib/csv';
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
  pending: { bg: 'bg-sun-soft', fg: 'text-clay', ring: 'ring-sun/40' },
  preparing: { bg: 'bg-ocean-soft', fg: 'text-ocean', ring: 'ring-ocean/30' },
  ready: { bg: 'bg-sage-soft', fg: 'text-sage', ring: 'ring-sage/40' },
  completed: { bg: 'bg-ink', fg: 'text-paper', ring: 'ring-ink/20' },
  cancelled: { bg: 'bg-paper-warm', fg: 'text-ink/50', ring: 'ring-black/10' },
};

type Range = 'today' | 'week' | 'month';

const POLL_INTERVAL = 8000;

export default function OrdersPage() {
  const { t } = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [range, setRange] = useState<Range>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const currency = restaurant?.currency ?? 'USD';

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setRefreshing(true);
      try {
        const [ordersRes, statsRes] = await Promise.all([
          api.listOrders(filterRef.current),
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
    },
    [] // load reads filterRef so it's stable
  );

  useEffect(() => {
    api.getMyRestaurant().then(({ restaurant }) => setRestaurant(restaurant));
  }, []);

  useEffect(() => {
    load();
  }, [filter, load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => load({ silent: true }), POLL_INTERVAL);
    const onVis = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [autoRefresh, load]);

  // Keyboard shortcuts: r = refresh, 1..6 = filter, e = export, p = pause/resume polling.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (k === 'r') {
        e.preventDefault();
        load();
      } else if (k === 'e') {
        e.preventDefault();
        exportOrders();
      } else if (k === 'p') {
        e.preventDefault();
        setAutoRefresh((v) => !v);
      } else if (/^[1-6]$/.test(k)) {
        const idx = Number(k) - 1;
        if (STATUS_FILTERS[idx]) setFilter(STATUS_FILTERS[idx]);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, orders, currency]);

  const updateStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      try {
        const { order } = await api.updateOrderStatus(id, status);
        setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
        load({ silent: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed');
      }
    },
    [load]
  );

  function exportOrders() {
    if (!orders.length) {
      toast('Nothing to export.');
      return;
    }
    const csv = toCsv(orders, [
      { header: 'id', get: (o) => o.id },
      { header: 'created_at', get: (o) => o.createdAt },
      { header: 'status', get: (o) => o.status },
      { header: 'table', get: (o) => o.table },
      { header: 'subtotal', get: (o) => o.subtotal },
      { header: 'currency', get: () => currency },
      { header: 'item_count', get: (o) => o.items.reduce((s, i) => s + i.quantity, 0) },
      {
        header: 'items',
        get: (o) => o.items.map((i) => `${i.quantity}x ${i.name}`).join(' | '),
      },
      { header: 'note', get: (o) => o.customerNote ?? '' },
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`orders-${stamp}.csv`, csv);
  }

  // Active range bucket — memoized so the StatGrid doesn't recompute on unrelated state.
  // Defensive defaults: an older API build may not return `thisMonth`.
  const activeBucket: OrderStatsBucket | null = useMemo(() => {
    if (!stats) return null;
    if (range === 'today') return stats.today ?? null;
    if (range === 'week') return stats.thisWeek ?? null;
    return stats.thisMonth ?? null;
  }, [stats, range]);

  // Daily series for sparkline (revenue) — slice to 7 or 14 based on range, memoized.
  // `stats.daily` may be missing when the API hasn't been redeployed yet.
  const sparklineData = useMemo(() => {
    const daily = stats?.daily ?? [];
    if (!daily.length) return [];
    const slice =
      range === 'today' ? daily.slice(-1) : range === 'week' ? daily.slice(-7) : daily;
    return slice.map((d) => ({ at: d.at, value: d.revenue }));
  }, [stats, range]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/50">{t('orders.section')}</p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">{t('orders.title')}</h1>
          {lastUpdated && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/40">
              <span className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full',
                    autoRefresh ? 'bg-sage' : 'bg-ink/30'
                  )}
                />
                {t('orders.updated')}: {lastUpdated.toLocaleTimeString()}
              </span>
              <span className="hidden md:inline">
                · <Kbd>R</Kbd> refresh · <Kbd>E</Kbd> export · <Kbd>P</Kbd> pause · <Kbd>1–6</Kbd> filter
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportOrders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-paper-warm"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors',
              autoRefresh
                ? 'border-sage/40 bg-sage-soft text-sage'
                : 'border-black/10 bg-white text-ink/60'
            )}
            title="Pause/resume auto-refresh (P)"
          >
            <Activity size={14} className={cn(autoRefresh && 'animate-pulse')} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-paper-warm"
          >
            <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            {t('orders.refresh')}
          </button>
        </div>
      </header>

      {/* Range tabs */}
      <div className="inline-flex w-fit items-center gap-1 rounded-full border border-black/10 bg-white p-1 text-xs">
        {(['today', 'week', 'month'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'rounded-full px-3 py-1.5 font-medium transition-colors',
              range === r ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-paper-warm'
            )}
          >
            {r === 'today' ? 'Today' : r === 'week' ? '7 days' : '30 days'}
          </button>
        ))}
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={
            range === 'today'
              ? t('orders.stats.today')
              : range === 'week'
                ? 'Orders · 7d'
                : 'Orders · 30d'
          }
          value={activeBucket?.orders ?? 0}
          icon={<Receipt size={14} />}
          spark={
            <Sparkline
              data={sparklineData.map((d) => ({ at: d.at, value: d.value }))}
              ariaLabel="Revenue over time"
              stroke="var(--chart-1)"
              fill="rgba(226, 70, 28, 0.15)"
            />
          }
        />
        <StatCard
          label={
            range === 'today'
              ? t('orders.stats.revenue')
              : range === 'week'
                ? 'Revenue · 7d'
                : 'Revenue · 30d'
          }
          value={formatPrice(activeBucket?.revenue ?? 0, currency)}
          icon={<Wallet size={14} />}
          accent="brand"
        />
        <StatCard
          label={t('orders.stats.pending')}
          value={stats?.pending ?? 0}
          icon={<Flame size={14} />}
          tone={stats && stats.pending > 0 ? 'alert' : undefined}
        />
        <StatCard
          label="Avg prep time"
          value={
            stats?.avgPrepTimeMinutes != null
              ? `${stats.avgPrepTimeMinutes.toFixed(1)} min`
              : '—'
          }
          icon={<Timer size={14} />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-ink/50">
              Revenue · last 14 days
            </p>
            <p className="font-mono tabular text-xs text-ink/40">
              {(stats?.daily ?? []).reduce((s, d) => s + d.revenue, 0) === 0
                ? 'No data yet'
                : null}
            </p>
          </div>
          <div className="h-32">
            <Sparkline
              data={(stats?.daily ?? []).map((d) => ({ at: d.at, value: d.revenue }))}
              width={640}
              height={128}
              ariaLabel="Revenue last 14 days"
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink/50">
            <TrendingUp size={12} /> Today by hour
          </div>
          <HourlyHeatmap data={stats?.hourlyToday ?? []} />
        </Card>
      </div>

      {/* Top items */}
      {stats && stats.topItems.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
            <Trophy size={14} /> {t('orders.stats.topItems')}
          </div>
          <BarStrip
            data={stats.topItems.map((it) => ({
              label: `${it.name} · ${formatPrice(it.revenue, currency)}`,
              value: it.quantity,
            }))}
            ariaLabel="Top selling items"
          />
        </Card>
      )}

      {/* Filters with counts */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s, idx) => {
          const active = filter === s;
          const count = countFor(s, stats);
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'bg-ink text-paper'
                  : 'bg-white text-ink/70 ring-1 ring-black/5 hover:bg-paper-warm'
              )}
            >
              <span>
                {s === 'all' ? t('orders.filter.all') : t(`orders.status.${s}`)}
              </span>
              {count != null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-mono tabular text-[10px]',
                    active ? 'bg-paper/20 text-paper' : 'bg-paper-warm text-ink/50'
                  )}
                >
                  {count}
                </span>
              )}
              <span className="hidden text-[9px] opacity-50 md:inline">{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="hatch h-40 animate-pulse rounded-2xl" />
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

function countFor(s: OrderStatus | 'all', stats: OrderStats | null): number | null {
  if (!stats || !stats.statusCounts) return null;
  if (s === 'all') {
    return Object.values(stats.statusCounts).reduce((a, b) => a + b, 0);
  }
  return stats.statusCounts[s] ?? 0;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-black/10 bg-paper-warm px-1.5 py-0.5 font-mono text-[10px] text-ink/70">
      {children}
    </kbd>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  tone,
  spark,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'brand';
  tone?: 'alert';
  spark?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        tone === 'alert' && 'ring-1 ring-sun/50',
        accent === 'brand' && 'bg-paper-warm'
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-ink/50">{label}</p>
        <div
          className={cn(
            'grid h-7 w-7 place-items-center rounded-lg',
            tone === 'alert'
              ? 'bg-sun-soft text-clay'
              : accent === 'brand'
                ? 'bg-brand text-paper'
                : 'bg-paper-warm text-ink/70'
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 font-display text-3xl tracking-tight tabular">{value}</p>
      {spark ? <div className="mt-2 h-10">{spark}</div> : null}
    </Card>
  );
}

const OrderRow = memo(function OrderRow({
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
  const ageMin = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  );
  const totalQty = useMemo(
    () => order.items.reduce((s, i) => s + i.quantity, 0),
    [order.items]
  );

  const nextActions = useMemo<
    Array<{ label: string; status: OrderStatus; variant?: 'primary' | 'danger' | 'ghost' }>
  >(() => {
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
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-warm px-2.5 py-0.5 font-mono text-[11px] text-ink/60">
            <Hash size={10} /> {ref}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-warm px-2.5 py-0.5 text-[11px] text-ink/60">
            <Clock size={10} /> {ageMin}m
          </span>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold tracking-tight tabular">
            {formatPrice(order.subtotal, currency)}
          </p>
          <p className="text-[11px] text-ink/50">
            {totalQty} × {order.items.length} items
          </p>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-paper-warm px-3 py-2 text-sm text-ink/70 transition-colors hover:bg-paper"
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {order.items
            .slice(0, 3)
            .map((i) => `${i.quantity}× ${i.name}`)
            .join(' · ')}
          {order.items.length > 3 && ` · +${order.items.length - 3}`}
        </span>
        <span className="shrink-0 text-xs text-ink/40">{expanded ? '–' : '+'}</span>
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
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-xs text-ink/50">{it.quantity}×</span>{' '}
                    <span className="font-medium">{it.name}</span>
                    {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                      <span className="block pl-5 text-[11px] text-ink/55">
                        {it.selectedModifiers.map((m) => m.optionName).join(' · ')}
                      </span>
                    )}
                    {it.notes && <span className="block pl-5 text-ink/50">— {it.notes}</span>}
                  </span>
                  <span className="shrink-0 font-mono tabular text-ink/60">
                    {formatPrice(it.price * it.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>
            {order.customerNote && (
              <p className="mt-3 rounded-xl bg-sun-soft px-3 py-2 text-xs text-clay">
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
                a.variant === 'danger' && 'bg-brand-soft text-brand-deep hover:bg-brand/15',
                a.variant === 'ghost' && 'bg-paper-warm text-ink/70 hover:bg-paper'
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </motion.article>
  );
});
