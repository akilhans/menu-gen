'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  X,
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { MenuItem, PublicMenuResponse } from '@menu-gen/shared';
import { api } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nProvider';

type MenuCategory = PublicMenuResponse['categories'][number];
type AddonSlot = 'drink' | 'side' | 'dessert';

const ADDON_KEYWORDS: Record<AddonSlot, string[]> = {
  drink: [
    'drink', 'beverage', 'cocktail', 'wine', 'beer', 'coffee', 'tea', 'soda', 'juice',
    'напит', 'кофе', 'чай', 'вино', 'пиво', 'сок',
    'ichim', 'qahva', 'choy', 'sharbat',
  ],
  side: [
    'side', 'fries', 'starter', 'appetizer', 'snack',
    'гарнир', 'закус', 'снэк',
    'garnir', 'salat',
  ],
  dessert: [
    'dessert', 'sweet', 'cake', 'pastry', 'ice cream',
    'десерт', 'сладк', 'торт', 'мороженое',
    'shirin',
  ],
};

function classifyCategory(name: string): AddonSlot | null {
  const n = name.toLowerCase();
  for (const slot of Object.keys(ADDON_KEYWORDS) as AddonSlot[]) {
    if (ADDON_KEYWORDS[slot].some((kw) => n.includes(kw))) return slot;
  }
  return null;
}

function pickSuggestions(
  categories: MenuCategory[],
  lines: CartLine[],
  max = 3,
): MenuItem[] {
  if (lines.length === 0 || categories.length === 0) return [];
  const cartItemIds = new Set(lines.map((l) => l.menuItemId));

  const slotsInCart = new Set<AddonSlot>();
  let hasMain = false;
  for (const cat of categories) {
    const slot = classifyCategory(cat.name);
    const containsCartItem = cat.items.some((i) => cartItemIds.has(i.id));
    if (!containsCartItem) continue;
    if (slot) slotsInCart.add(slot);
    else hasMain = true;
  }
  if (!hasMain) return [];

  const slotOrder: AddonSlot[] = ['drink', 'side', 'dessert'];
  const out: MenuItem[] = [];
  const used = new Set<string>();

  const isCandidate = (item: MenuItem) =>
    item.available &&
    !cartItemIds.has(item.id) &&
    !used.has(item.id) &&
    (!item.modifierGroups || item.modifierGroups.length === 0);

  for (const slot of slotOrder) {
    if (slotsInCart.has(slot) || out.length >= max) continue;
    const cat = categories.find((c) => classifyCategory(c.name) === slot);
    const candidate = cat?.items.find(isCandidate);
    if (candidate) {
      out.push(candidate);
      used.add(candidate.id);
    }
  }

  if (out.length < max) {
    for (const slot of slotOrder) {
      if (slotsInCart.has(slot)) continue;
      const cat = categories.find((c) => classifyCategory(c.name) === slot);
      if (!cat) continue;
      for (const item of cat.items) {
        if (out.length >= max) break;
        if (!isCandidate(item)) continue;
        out.push(item);
        used.add(item.id);
      }
    }
  }

  return out;
}

export interface CartLineModifier {
  groupId: string;
  optionId: string;
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface CartLine {
  /** Composite cart-line key: menu item id + selected modifier signature. */
  key: string;
  menuItemId: string;
  name: string;
  /** Unit price including modifier deltas. */
  price: number;
  basePrice: number;
  quantity: number;
  imageUrl?: string;
  selectedModifiers: CartLineModifier[];
}

interface CartProps {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  categories: MenuCategory[];
  currency: string;
  theme: string;
  initialTable: string;
  restaurantSlug: string;
  onInc: (key: string) => void;
  onDec: (key: string) => void;
  onRemove: (key: string) => void;
  onAddSuggestion: (item: MenuItem) => void;
  onPlaced: () => void;
}

export function Cart({
  open,
  onClose,
  lines,
  categories,
  currency,
  theme,
  initialTable,
  restaurantSlug,
  onInc,
  onDec,
  onRemove,
  onAddSuggestion,
  onPlaced,
}: CartProps) {
  const { t } = useT();
  const [table, setTable] = useState(initialTable);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ ref: string } | null>(null);
  const tableLocked = Boolean(initialTable);

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);
  const suggestions = useMemo(
    () => pickSuggestions(categories, lines),
    [categories, lines],
  );

  async function handleSubmit() {
    if (!table.trim()) {
      toast.error(t('cart.tableRequired'));
      return;
    }
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      const { order } = await api.createOrder({
        restaurantSlug,
        table: table.trim(),
        items: lines.map((l) => ({
          menuItem: l.menuItemId,
          quantity: l.quantity,
          selectedModifiers: l.selectedModifiers.length
            ? l.selectedModifiers.map((m) => ({
                groupId: m.groupId,
                optionId: m.optionId,
              }))
            : undefined,
        })),
        customerNote: note.trim() || undefined,
      });
      setConfirmed({ ref: order.id.slice(-6).toUpperCase() });
      onPlaced();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cart.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onClose();
    // reset confirmation on next open
    setTimeout(() => setConfirmed(null), 400);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-paper shadow-card md:inset-x-auto md:left-1/2 md:bottom-8 md:max-h-[85dvh] md:w-full md:max-w-md md:-translate-x-1/2 md:rounded-3xl"
          >
            {/* grabber */}
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-black/15" />
            </div>

            {confirmed ? (
              <ConfirmedView
                reference={confirmed.ref}
                table={table}
                theme={theme}
                onNewOrder={() => {
                  setConfirmed(null);
                  setNote('');
                  handleClose();
                }}
              />
            ) : (
              <>
                <div className="flex items-center justify-between px-5 py-4">
                  <h2 className="font-display text-2xl tracking-tight">
                    {t('cart.title')}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 text-ink/60 hover:bg-black/5"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5">
                  {lines.length === 0 ? (
                    <div className="grid place-items-center py-14 text-center text-sm text-ink/50">
                      <ShoppingBag size={28} className="mb-3 text-ink/30" />
                      <p>{t('cart.empty')}</p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {lines.map((line) => (
                        <li
                          key={line.key}
                          className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-soft"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{line.name}</p>
                            {line.selectedModifiers.length > 0 && (
                              <p className="truncate text-[11px] text-ink/50">
                                {line.selectedModifiers.map((m) => m.optionName).join(' · ')}
                              </p>
                            )}
                            <p className="mt-0.5 text-xs text-ink/50">
                              {formatPrice(line.price, currency)} × {line.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onDec(line.key)}
                              className="grid h-8 w-8 place-items-center rounded-full bg-black/5 text-ink hover:bg-black/10"
                              aria-label="Decrease"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center font-mono text-sm tabular-nums">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() => onInc(line.key)}
                              className="grid h-8 w-8 place-items-center rounded-full text-white"
                              style={{ background: theme }}
                              aria-label="Increase"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {suggestions.length > 0 && (
                    <div className="mt-5 mb-1">
                      <p className="mb-2 text-xs font-medium text-ink/70">
                        {t('cart.pairWith')}
                      </p>
                      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
                        {suggestions.map((item) => (
                          <li key={item.id} className="shrink-0">
                            <button
                              type="button"
                              onClick={() => onAddSuggestion(item)}
                              className="group flex w-36 flex-col gap-1.5 rounded-2xl bg-white p-2 text-left shadow-soft transition-shadow hover:shadow-card"
                            >
                              <div className="relative h-20 w-full overflow-hidden rounded-xl bg-black/5">
                                {item.imageUrl ? (
                                  <Image
                                    src={item.imageUrl}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="144px"
                                    unoptimized
                                  />
                                ) : (
                                  <div
                                    className="grid h-full w-full place-items-center"
                                    style={{ color: theme }}
                                  >
                                    <UtensilsCrossed size={20} />
                                  </div>
                                )}
                              </div>
                              <p className="line-clamp-2 px-0.5 text-[12px] font-medium leading-tight">
                                {item.name}
                              </p>
                              <div className="flex items-center justify-between px-0.5">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: theme }}
                                >
                                  {formatPrice(item.price, currency)}
                                </span>
                                <span
                                  className="grid h-6 w-6 place-items-center rounded-full text-white transition-transform group-active:scale-90"
                                  style={{ background: theme }}
                                  aria-label="Add"
                                >
                                  <Plus size={12} strokeWidth={2.5} />
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border-t border-black/5 bg-paper px-5 pb-5 pt-4 safe-bottom">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-ink/70">
                        {t('cart.table')}
                      </label>
                      {tableLocked ? (
                        <div
                          className="flex h-11 items-center justify-between rounded-xl border border-black/10 bg-black/5 px-3 text-sm"
                          aria-readonly
                        >
                          <span className="font-medium">
                            {t('orders.table', { table })}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ background: theme }}
                          >
                            <Lock size={10} /> QR
                          </span>
                        </div>
                      ) : (
                        <>
                          <input
                            value={table}
                            onChange={(e) => setTable(e.target.value)}
                            placeholder="5 / A3"
                            className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm placeholder:text-ink/30 focus-visible:border-ink/30 focus-visible:outline-none"
                          />
                          <p className="text-[11px] text-ink/50">{t('cart.tableHint')}</p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-ink/70">
                        {t('cart.note')}
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('cart.notePlaceholder')}
                        rows={2}
                        className="resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus-visible:border-ink/30 focus-visible:outline-none"
                      />
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-sm text-ink/60">{t('cart.subtotal')}</span>
                      <span className="font-display text-2xl font-semibold tracking-tight">
                        {formatPrice(subtotal, currency)}
                      </span>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={lines.length === 0 || submitting}
                      className={cn(
                        'inline-flex h-12 items-center justify-center gap-2 rounded-xl font-medium text-white transition-all disabled:opacity-40',
                        'hover:opacity-90'
                      )}
                      style={{ background: theme }}
                    >
                      {submitting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <ShoppingBag size={16} />
                          {t('cart.place')} · {totalItems}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ConfirmedView({
  reference,
  table,
  theme,
  onNewOrder,
}: {
  reference: string;
  table: string;
  theme: string;
  onNewOrder: () => void;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 14 }}
        className="grid h-16 w-16 place-items-center rounded-full text-white"
        style={{ background: theme }}
      >
        <Check size={28} strokeWidth={2.5} />
      </motion.div>
      <h2 className="font-display text-3xl tracking-tight">{t('cart.placedTitle')}</h2>
      <p className="max-w-xs text-sm text-ink/60">{t('cart.placedDesc')}</p>
      <div className="mt-2 flex gap-3 text-xs">
        <span className="rounded-full bg-black/5 px-3 py-1 text-ink/70">
          {t('orders.table', { table })}
        </span>
        <span className="rounded-full bg-black/5 px-3 py-1 text-ink/70">
          {t('cart.placedRef')}: <span className="font-mono">{reference}</span>
        </span>
      </div>
      <button
        onClick={onNewOrder}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium text-white"
        style={{ background: theme }}
      >
        {t('cart.newOrder')}
      </button>
    </div>
  );
}
