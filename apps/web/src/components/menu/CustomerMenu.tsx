'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram,
  MapPin,
  Phone,
  Search,
  UtensilsCrossed,
  Sparkles,
  Plus,
  Minus,
  ShoppingBag,
  X,
} from 'lucide-react';
import type {
  MenuItem,
  ModifierGroup,
  PublicMenuResponse,
} from '@menu-gen/shared';
import { formatPrice } from '@/lib/utils';
import { useT } from '@/i18n/I18nProvider';
import { Cart, type CartLine, type CartLineModifier } from './Cart';

type CartMap = Record<string, CartLine>;

function modifierSignature(mods: CartLineModifier[]): string {
  if (mods.length === 0) return '';
  return mods
    .map((m) => `${m.groupId}:${m.optionId}`)
    .sort()
    .join('|');
}

function cartKey(menuItemId: string, mods: CartLineModifier[]) {
  const sig = modifierSignature(mods);
  return sig ? `${menuItemId}::${sig}` : menuItemId;
}

function hasModifiers(item: { modifierGroups?: ModifierGroup[] }) {
  return Boolean(item.modifierGroups && item.modifierGroups.length > 0);
}

export function CustomerMenu({ data }: { data: PublicMenuResponse }) {
  const { t } = useT();
  const { restaurant, categories } = data;
  const searchParams = useSearchParams();
  const urlTable = (searchParams.get('table') ?? '').trim();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [cart, setCart] = useState<CartMap>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);

  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const theme = restaurant.themeColor || '#FF5A1F';

  const totalItems = useMemo(
    () => categories.reduce((acc, c) => acc + c.items.length, 0),
    [categories]
  );
  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);
  const cartSubtotal = cartLines.reduce((s, l) => s + l.price * l.quantity, 0);

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? '').toLowerCase().includes(q) ||
            i.tags.some((tag) => tag.toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, query]);

  useEffect(() => {
    if (query.trim()) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace('cat-', ''));
          }
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );
    Object.values(sectionsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories, query]);

  function scrollToCategory(id: string) {
    const el = sectionsRef.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function addToCart(
    item: { id: string; name: string; price: number; imageUrl?: string },
    selectedModifiers: CartLineModifier[]
  ) {
    setCart((prev) => {
      const key = cartKey(item.id, selectedModifiers);
      const existing = prev[key];
      const deltaSum = selectedModifiers.reduce((s, m) => s + m.priceDelta, 0);
      const unitPrice = Math.max(0, item.price + deltaSum);
      const quantity = Math.min((existing?.quantity ?? 0) + 1, 99);
      return {
        ...prev,
        [key]: {
          key,
          menuItemId: item.id,
          name: item.name,
          basePrice: item.price,
          price: unitPrice,
          imageUrl: item.imageUrl,
          quantity,
          selectedModifiers,
        },
      };
    });
  }

  function incLine(key: string) {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: { ...existing, quantity: Math.min(existing.quantity + 1, 99) },
      };
    });
  }

  function decLine(key: string) {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const quantity = existing.quantity - 1;
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { ...existing, quantity } };
    });
  }

  function removeLine(key: string) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleAddClick(item: MenuItem) {
    if (hasModifiers(item)) {
      setPickerItem(item);
    } else {
      addToCart(item, []);
    }
  }

  function lineCountForItem(itemId: string) {
    return cartLines
      .filter((l) => l.menuItemId === itemId)
      .reduce((s, l) => s + l.quantity, 0);
  }

  function onPlaced() {
    setCart({});
  }

  const hasContact = restaurant.phone || restaurant.instagram || restaurant.address;

  return (
    <div className="min-h-dvh bg-paper">
      {/* Hero */}
      <section className="relative h-[360px] w-full overflow-hidden md:h-[460px]">
        <div
          className="absolute inset-0"
          style={{
            background: restaurant.coverUrl
              ? `url(${restaurant.coverUrl}) center/cover`
              : `linear-gradient(135deg, ${theme} 0%, #1a1a1f 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-paper" />

        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-5 pb-24 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white backdrop-blur"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
            >
              <Sparkles size={11} /> {t('customer.items', { count: totalItems })}
            </span>
            <h1
              className="mt-4 font-display text-5xl font-medium leading-[0.95] tracking-tight text-white md:text-7xl"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.3)' }}
            >
              {restaurant.name}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Info card */}
      <div className="mx-auto -mt-16 max-w-3xl px-4 md:-mt-20 md:px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-card md:p-8"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
            style={{ background: theme }}
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
            {restaurant.logoUrl ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-soft md:h-24 md:w-24">
                <Image
                  src={restaurant.logoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-white shadow-soft md:h-24 md:w-24"
                style={{ background: theme }}
              >
                <UtensilsCrossed size={28} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {restaurant.description && (
                <p className="text-base leading-relaxed text-ink/80 md:text-[17px]">
                  {restaurant.description}
                </p>
              )}
              {urlTable && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white" style={{ background: theme }}>
                  <Sparkles size={12} /> {t('orders.table', { table: urlTable })}
                </div>
              )}
              {hasContact && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {restaurant.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-ink/70 transition-colors hover:bg-black/10"
                    >
                      <MapPin size={12} /> {restaurant.address}
                    </a>
                  )}
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-ink/70 transition-colors hover:bg-black/10"
                    >
                      <Phone size={12} /> {restaurant.phone}
                    </a>
                  )}
                  {restaurant.instagram && (
                    <a
                      href={`https://instagram.com/${restaurant.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-ink/70 transition-colors hover:bg-black/10"
                    >
                      <Instagram size={12} /> {restaurant.instagram}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky search + categories */}
      <div className="sticky top-0 z-30 mx-auto mt-8 max-w-3xl bg-paper/90 px-4 pb-3 pt-3 backdrop-blur-md md:px-5">
        <div className="relative mb-3">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('customer.search')}
            className="h-11 w-full rounded-full border border-black/10 bg-white pl-10 pr-4 text-sm placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => scrollToCategory(c.id)}
                className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: active ? theme : 'rgba(0,0,0,0.05)',
                  color: active ? '#fff' : '#1A1A1F',
                  boxShadow: active ? `0 6px 18px -6px ${theme}80` : undefined,
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu sections */}
      <div className={`mx-auto max-w-3xl px-4 md:px-5 ${cartCount > 0 ? 'pb-36' : 'pb-16'}`}>
        {filteredCategories.length === 0 ? (
          <div className="mt-16 text-center text-ink/50">
            <p className="text-sm">{t('customer.noResults', { query })}</p>
          </div>
        ) : (
          filteredCategories.map((category, idx) => (
            <section
              key={category.id}
              id={`cat-${category.id}`}
              ref={(el) => {
                sectionsRef.current[category.id] = el;
              }}
              className={`scroll-mt-36 ${idx > 0 ? 'pt-14' : 'pt-8'}`}
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-black/5 pb-4">
                <h2 className="font-display text-3xl tracking-tight md:text-4xl">
                  {category.name}
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
                  {category.items.length.toString().padStart(2, '0')}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {category.items.map((item) => {
                  const itemHasMods = hasModifiers(item);
                  const defaultLine = !itemHasMods ? cart[item.id] : null;
                  const totalQty = itemHasMods ? lineCountForItem(item.id) : 0;
                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.35 }}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft transition-shadow hover:shadow-card"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-black/5 to-black/10">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            unoptimized
                          />
                        ) : (
                          <div
                            className="grid h-full w-full place-items-center"
                            style={{ color: theme }}
                          >
                            <UtensilsCrossed size={36} />
                          </div>
                        )}
                        {item.tags.length > 0 && (
                          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                            {item.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-ink shadow-soft backdrop-blur"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Add / stepper */}
                        <div className="absolute bottom-3 right-3">
                          <AnimatePresence mode="wait" initial={false}>
                            {defaultLine ? (
                              <motion.div
                                key="stepper"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card"
                              >
                                <button
                                  onClick={() => decLine(item.id)}
                                  className="grid h-8 w-8 place-items-center rounded-full text-ink hover:bg-black/5"
                                  aria-label="Decrease"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-5 text-center font-mono text-sm font-semibold tabular-nums">
                                  {defaultLine.quantity}
                                </span>
                                <button
                                  onClick={() => incLine(item.id)}
                                  className="grid h-8 w-8 place-items-center rounded-full text-white"
                                  style={{ background: theme }}
                                  aria-label="Increase"
                                >
                                  <Plus size={14} />
                                </button>
                              </motion.div>
                            ) : (
                              <motion.button
                                key="add"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => handleAddClick(item)}
                                className="relative grid h-10 w-10 place-items-center rounded-full text-white shadow-card transition-transform hover:scale-105 active:scale-95"
                                style={{ background: theme }}
                                aria-label="Add to order"
                              >
                                <Plus size={18} strokeWidth={2.5} />
                                {totalQty > 0 && (
                                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
                                    {totalQty}
                                  </span>
                                )}
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-lg font-medium leading-tight tracking-tight">
                            {item.name}
                          </h3>
                          <span
                            className="shrink-0 whitespace-nowrap font-display text-base font-semibold tracking-tight"
                            style={{ color: theme }}
                          >
                            {formatPrice(item.price, restaurant.currency)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="line-clamp-3 text-sm leading-relaxed text-ink/60">
                            {item.description}
                          </p>
                        )}
                        {item.allergens.length > 0 && (
                          <p className="mt-auto pt-1 text-[10px] uppercase tracking-wider text-ink/40">
                            {t('customer.allergens')}: {item.allergens.join(', ')}
                          </p>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Visit us */}
        {hasContact && (
          <section className="relative mt-20 overflow-hidden rounded-3xl bg-ink px-6 py-10 text-paper md:px-12 md:py-14">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
              style={{ background: theme }}
            />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
              style={{ background: theme }}
            />
            <div className="relative">
              <h3 className="font-display text-3xl tracking-tight md:text-4xl">
                {t('customer.visitUs')}
              </h3>
              {restaurant.address && (
                <p className="mt-2 text-sm text-paper/60">{restaurant.address}</p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {restaurant.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <MapPin size={14} /> {t('customer.directions')}
                  </a>
                )}
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-opacity hover:opacity-90"
                    style={{ background: theme, color: 'white' }}
                  >
                    <Phone size={14} /> {t('customer.callUs')}
                  </a>
                )}
                {restaurant.instagram && (
                  <a
                    href={`https://instagram.com/${restaurant.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <Instagram size={14} /> {t('customer.instagram')}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="mt-10 text-center text-xs text-ink-muted">
          <p>
            {t('customer.poweredBy')}{' '}
            <a href="/" className="font-medium text-ink">
              menu-gen
            </a>
          </p>
        </footer>
      </div>

      {/* Floating "review order" bar */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="fixed inset-x-0 bottom-4 z-30 mx-auto flex max-w-sm justify-center px-4 safe-bottom"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-full px-5 py-3.5 text-sm font-medium text-white shadow-card transition-transform active:scale-[0.98]"
              style={{ background: theme }}
            >
              <span className="inline-flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/25 text-xs font-semibold">
                  {cartCount}
                </span>
                <ShoppingBag size={16} />
                {t('cart.review')}
              </span>
              <span className="font-semibold">{formatPrice(cartSubtotal, restaurant.currency)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Cart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cartLines}
        categories={categories}
        currency={restaurant.currency}
        theme={theme}
        initialTable={urlTable}
        restaurantSlug={restaurant.slug}
        onInc={incLine}
        onDec={decLine}
        onRemove={removeLine}
        onAddSuggestion={(item) => addToCart(item, [])}
        onPlaced={onPlaced}
      />

      <ModifierPicker
        item={pickerItem}
        currency={restaurant.currency}
        theme={theme}
        onClose={() => setPickerItem(null)}
        onConfirm={(item, mods) => {
          addToCart(item, mods);
          setPickerItem(null);
        }}
      />
    </div>
  );
}

function ModifierPicker({
  item,
  currency,
  theme,
  onClose,
  onConfirm,
}: {
  item: MenuItem | null;
  currency: string;
  theme: string;
  onClose: () => void;
  onConfirm: (item: MenuItem, mods: CartLineModifier[]) => void;
}) {
  const { t } = useT();
  const [picks, setPicks] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!item) return;
    // Pre-select first option of each required single-selection group.
    const initial: Record<string, string[]> = {};
    for (const g of item.modifierGroups) {
      if (g.selectionType === 'single' && g.required && g.options[0]) {
        initial[g.id] = [g.options[0].id];
      }
    }
    setPicks(initial);
  }, [item]);

  if (!item) return null;

  function togglePick(group: ModifierGroup, optionId: string) {
    setPicks((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selectionType === 'single') {
        return { ...prev, [group.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= group.max) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  function buildMods(): CartLineModifier[] | null {
    const out: CartLineModifier[] = [];
    for (const g of item!.modifierGroups) {
      const chosen = picks[g.id] ?? [];
      if (chosen.length < g.min) return null;
      for (const optId of chosen) {
        const opt = g.options.find((o) => o.id === optId);
        if (!opt) return null;
        out.push({
          groupId: g.id,
          optionId: opt.id,
          groupName: g.name,
          optionName: opt.name,
          priceDelta: opt.priceDelta,
        });
      }
    }
    return out;
  }

  const mods = buildMods();
  const valid = mods !== null;
  const deltaSum = (mods ?? []).reduce((s, m) => s + m.priceDelta, 0);
  const unitPrice = Math.max(0, item.price + deltaSum);

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-paper shadow-card md:inset-x-auto md:left-1/2 md:bottom-8 md:max-h-[85dvh] md:w-full md:max-w-md md:-translate-x-1/2 md:rounded-3xl"
          >
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-black/15" />
            </div>
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-display text-2xl tracking-tight">{item.name}</h2>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-ink/60">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-ink/60 hover:bg-black/5"
                aria-label={t('common.cancel')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
              <div className="flex flex-col gap-5">
                {item.modifierGroups.map((group) => {
                  const chosen = picks[group.id] ?? [];
                  return (
                    <section key={group.id}>
                      <div className="mb-2 flex items-baseline justify-between">
                        <h3 className="text-sm font-medium text-ink">
                          {group.name}
                          {group.required && (
                            <span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-red-500">
                              · {t('modifiers.requiredBadge')}
                            </span>
                          )}
                        </h3>
                        <span className="text-[11px] text-ink/40">
                          {group.selectionType === 'single'
                            ? t('modifiers.pickOne')
                            : t('modifiers.pickUpTo', { n: group.max })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {group.options.map((opt) => {
                          const selected = chosen.includes(opt.id);
                          const disabled =
                            !opt.available ||
                            (!selected &&
                              group.selectionType === 'multiple' &&
                              chosen.length >= group.max);
                          return (
                            <button
                              key={opt.id}
                              onClick={() => togglePick(group, opt.id)}
                              disabled={disabled}
                              type="button"
                              className="flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left text-sm shadow-soft transition-all disabled:opacity-40"
                              style={{
                                borderColor: selected ? theme : 'rgba(0,0,0,0.08)',
                                background: selected ? `${theme}10` : 'white',
                              }}
                            >
                              <span
                                className="grid h-5 w-5 shrink-0 place-items-center rounded-full border"
                                style={{
                                  borderColor: selected ? theme : 'rgba(0,0,0,0.2)',
                                  background: selected ? theme : 'transparent',
                                  borderRadius:
                                    group.selectionType === 'single' ? '9999px' : '6px',
                                }}
                              >
                                {selected && (
                                  <span className="h-2 w-2 rounded-full bg-white" />
                                )}
                              </span>
                              <span className="flex-1 font-medium">{opt.name}</span>
                              {opt.priceDelta !== 0 && (
                                <span className="text-xs text-ink/60">
                                  {opt.priceDelta > 0 ? '+' : ''}
                                  {formatPrice(opt.priceDelta, currency)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-black/5 bg-paper px-5 pb-5 pt-4 safe-bottom">
              <button
                disabled={!valid}
                onClick={() => {
                  if (mods) onConfirm(item, mods);
                }}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-medium text-white transition-all disabled:opacity-40"
                style={{ background: theme }}
              >
                <Plus size={16} />
                {t('modifiers.addFor', {
                  price: formatPrice(unitPrice, currency),
                })}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
