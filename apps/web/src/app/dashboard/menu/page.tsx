'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, ImageIcon, Layers } from 'lucide-react';
import type {
  Category,
  MenuItem,
  ModifierGroup,
  Restaurant,
} from '@menu-gen/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { formatPrice } from '@/lib/utils';
import { useT } from '@/i18n/I18nProvider';

export default function MenuPage() {
  const { t } = useT();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  async function load() {
    setLoading(true);
    const [r, c, i] = await Promise.all([
      api.getMyRestaurant(),
      api.listCategories(),
      api.listItems(),
    ]);
    setRestaurant(r.restaurant);
    setCategories(c.categories);
    setItems(i.items);
    if (!activeCategory && c.categories[0]) setActiveCategory(c.categories[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCategory() {
    const name = prompt(t('menu.category.prompt'));
    if (!name) return;
    try {
      const { category } = await api.createCategory({ name });
      setCategories((prev) => [...prev, category]);
      setActiveCategory(category.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('err.failed'));
    }
  }

  async function renameCategory(cat: Category) {
    const name = prompt(t('menu.category.rename'), cat.name);
    if (!name || name === cat.name) return;
    try {
      const { category } = await api.updateCategory(cat.id, { name });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? category : c)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('err.failed'));
    }
  }

  async function deleteCategory(cat: Category) {
    if (!confirm(t('menu.category.deleteConfirm', { name: cat.name }))) return;
    try {
      await api.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setItems((prev) => prev.filter((i) => i.category !== cat.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('err.failed'));
    }
  }

  async function saveItem(formData: ItemFormState, id?: string) {
    const payload = {
      category: formData.category,
      name: formData.name,
      description: formData.description || undefined,
      price: Number(formData.price),
      imageUrl: formData.imageUrl || undefined,
      available: formData.available,
      tags: formData.tags.split(',').map((s) => s.trim()).filter(Boolean),
      allergens: formData.allergens.split(',').map((s) => s.trim()).filter(Boolean),
      modifierGroups: formData.modifierGroups,
    };

    try {
      if (id) {
        const { item } = await api.updateItem(id, payload);
        setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
        toast.success(t('menu.item.updated'));
      } else {
        const { item } = await api.createItem(payload);
        setItems((prev) => [...prev, item]);
        toast.success(t('menu.item.added'));
      }
      setShowItemModal(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('err.failed'));
    }
  }

  async function deleteItem(item: MenuItem) {
    if (!confirm(t('menu.item.deleteConfirm', { name: item.name }))) return;
    try {
      await api.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('err.failed'));
    }
  }

  const itemsInActive = useMemo(
    () => items.filter((i) => i.category === activeCategory),
    [items, activeCategory]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm text-ink/50">{t('menu.section')}</p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">{t('menu.title')}</h1>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowItemModal(true);
          }}
          disabled={categories.length === 0}
        >
          <Plus size={16} /> {t('menu.newItem')}
        </Button>
      </header>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink/70">{t('menu.categories')}</h2>
          <Button size="sm" variant="outline" onClick={addCategory}>
            <Plus size={14} /> {t('common.add')}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-ink/50">{t('menu.noCategories')}</p>
          )}
          {categories.map((c) => {
            const active = activeCategory === c.id;
            return (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-full px-1 pl-3 text-sm transition-colors ${
                  active ? 'bg-ink text-paper' : 'bg-black/5 text-ink/80'
                }`}
              >
                <button onClick={() => setActiveCategory(c.id)} className="py-1.5">
                  {c.name}
                </button>
                <button
                  onClick={() => renameCategory(c)}
                  className="ml-1 rounded-full p-1 hover:bg-black/10"
                  aria-label={t('common.edit')}
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => deleteCategory(c)}
                  className="rounded-full p-1 hover:bg-black/10"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-black/5" />
      ) : itemsInActive.length === 0 ? (
        <Card className="grid place-items-center py-14 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black/5 text-ink/60">
            <ImageIcon size={22} />
          </div>
          <p className="mt-3 text-sm text-ink/60">
            {categories.length === 0 ? t('menu.noCategories') : t('menu.noItems')}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setEditingItem(null);
              setShowItemModal(true);
            }}
            disabled={categories.length === 0}
          >
            <Plus size={16} /> {t('menu.addItem')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {itemsInActive.map((item) => (
            <Card key={item.id} className="flex flex-col gap-3 overflow-hidden p-0">
              {item.imageUrl ? (
                <div className="relative h-36 w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="grid h-36 w-full place-items-center bg-gradient-to-br from-black/5 to-black/10 text-ink/40">
                  <ImageIcon size={22} />
                </div>
              )}
              <div className="flex flex-col gap-2 p-4 pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="line-clamp-2 text-sm text-ink/60">
                      {item.description || t('menu.noDescription')}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-lg tracking-tight">
                    {formatPrice(item.price, restaurant?.currency ?? 'USD')}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                      item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-black/5 text-ink/60'
                    }`}
                  >
                    {item.available ? t('common.available') : t('common.hidden')}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowItemModal(true);
                      }}
                      className="rounded-lg p-2 text-ink/60 hover:bg-black/5 hover:text-ink"
                      aria-label={t('common.edit')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteItem(item)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showItemModal && categories.length > 0 && (
        <ItemModal
          item={editingItem ?? undefined}
          categories={categories}
          defaultCategory={activeCategory ?? categories[0].id}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSave={(data) => saveItem(data, editingItem?.id)}
        />
      )}
    </div>
  );
}

interface ItemFormState {
  category: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  available: boolean;
  tags: string;
  allergens: string;
  modifierGroups: ModifierGroup[];
}

function shortId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

function ItemModal({
  item,
  categories,
  defaultCategory,
  onClose,
  onSave,
}: {
  item?: MenuItem;
  categories: Category[];
  defaultCategory: string;
  onClose: () => void;
  onSave: (data: ItemFormState) => void;
}) {
  const { t } = useT();

  const pickValidCategory = (preferred?: string) => {
    if (preferred && categories.some((c) => c.id === preferred)) return preferred;
    if (defaultCategory && categories.some((c) => c.id === defaultCategory)) return defaultCategory;
    return categories[0]?.id ?? '';
  };

  const [form, setForm] = useState<ItemFormState>(() => ({
    category: pickValidCategory(item?.category),
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price != null ? String(item.price) : '',
    imageUrl: item?.imageUrl ?? '',
    available: item?.available ?? true,
    tags: item?.tags?.join(', ') ?? '',
    allergens: item?.allergens?.join(', ') ?? '',
    modifierGroups: item?.modifierGroups
      ? item.modifierGroups.map((g) => ({
          ...g,
          options: g.options.map((o) => ({ ...o })),
        }))
      : [],
  }));
  const [saving, setSaving] = useState(false);

  // Keep form.category synced to a real id — covers prop changes & deletions.
  useEffect(() => {
    setForm((p) => {
      const valid = categories.some((c) => c.id === p.category);
      if (valid) return p;
      const fallback = pickValidCategory(p.category);
      return fallback === p.category ? p : { ...p, category: fallback };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, defaultCategory]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const category = pickValidCategory(form.category);
    if (!category) {
      toast.error(t('menu.fields.category'));
      return;
    }
    if (!form.price) {
      toast.error(t('menu.fields.price'));
      return;
    }
    for (const g of form.modifierGroups) {
      if (!g.name.trim()) {
        toast.error(t('modifiers.errGroupName'));
        return;
      }
      if (g.options.length === 0) {
        toast.error(t('modifiers.errNoOptions', { group: g.name }));
        return;
      }
      for (const o of g.options) {
        if (!o.name.trim()) {
          toast.error(t('modifiers.errOptionName', { group: g.name }));
          return;
        }
      }
    }
    setSaving(true);
    try {
      await onSave({ ...form, category });
    } finally {
      setSaving(false);
    }
  }

  function addGroup() {
    setForm((p) => ({
      ...p,
      modifierGroups: [
        ...p.modifierGroups,
        {
          id: shortId(),
          name: '',
          selectionType: 'single',
          required: false,
          min: 0,
          max: 1,
          options: [{ id: shortId(), name: '', priceDelta: 0, available: true }],
        },
      ],
    }));
  }

  function updateGroup(idx: number, patch: Partial<ModifierGroup>) {
    setForm((p) => {
      const next = [...p.modifierGroups];
      const merged: ModifierGroup = { ...next[idx], ...patch };
      // keep min/max consistent with selectionType + required
      if (patch.selectionType === 'single') {
        merged.max = 1;
        if (merged.min > 1) merged.min = merged.required ? 1 : 0;
      } else if (patch.selectionType === 'multiple') {
        if (merged.max < 1) merged.max = Math.max(1, merged.options.length);
      }
      if (patch.required === true && merged.min < 1) merged.min = 1;
      if (patch.required === false && merged.min > 0) merged.min = 0;
      next[idx] = merged;
      return { ...p, modifierGroups: next };
    });
  }

  function removeGroup(idx: number) {
    setForm((p) => ({
      ...p,
      modifierGroups: p.modifierGroups.filter((_, i) => i !== idx),
    }));
  }

  function addOption(gIdx: number) {
    setForm((p) => {
      const next = [...p.modifierGroups];
      next[gIdx] = {
        ...next[gIdx],
        options: [
          ...next[gIdx].options,
          { id: shortId(), name: '', priceDelta: 0, available: true },
        ],
      };
      return { ...p, modifierGroups: next };
    });
  }

  function updateOption(
    gIdx: number,
    oIdx: number,
    patch: Partial<ModifierGroup['options'][number]>
  ) {
    setForm((p) => {
      const next = [...p.modifierGroups];
      const opts = [...next[gIdx].options];
      opts[oIdx] = { ...opts[oIdx], ...patch };
      next[gIdx] = { ...next[gIdx], options: opts };
      return { ...p, modifierGroups: next };
    });
  }

  function removeOption(gIdx: number, oIdx: number) {
    setForm((p) => {
      const next = [...p.modifierGroups];
      next[gIdx] = {
        ...next[gIdx],
        options: next[gIdx].options.filter((_, i) => i !== oIdx),
      };
      return { ...p, modifierGroups: next };
    });
  }

  const setField = <K extends keyof ItemFormState>(k: K, v: ItemFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-card"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-tight">
            {item ? t('menu.item.edit') : t('menu.item.new')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink/60 hover:bg-black/5"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink/80">{t('menu.fields.category')}</label>
            <select
              className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm"
              value={categories.some((c) => c.id === form.category) ? form.category : (categories[0]?.id ?? '')}
              onChange={(e) => setField('category', e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('menu.fields.name')}
            required
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          <Textarea
            label={t('menu.fields.description')}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
          <Input
            label={t('menu.fields.price')}
            type="number"
            step="0.01"
            min="0"
            required
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
          />
          <ImageUpload
            label={t('menu.fields.image')}
            value={form.imageUrl}
            onChange={(url) => setField('imageUrl', url)}
          />
          <Input
            label={t('menu.fields.tags')}
            placeholder={t('menu.fields.tagsPlaceholder')}
            value={form.tags}
            onChange={(e) => setField('tags', e.target.value)}
          />
          <Input
            label={t('menu.fields.allergens')}
            placeholder={t('menu.fields.allergensPlaceholder')}
            value={form.allergens}
            onChange={(e) => setField('allergens', e.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setField('available', e.target.checked)}
              className="h-4 w-4 rounded"
            />
            {t('menu.fields.available')}
          </label>

          {/* Modifier groups */}
          <div className="rounded-2xl border border-black/10 bg-paper/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium text-ink/80">
                <Layers size={14} />
                {t('modifiers.title')}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addGroup}>
                <Plus size={12} /> {t('modifiers.addGroup')}
              </Button>
            </div>
            {form.modifierGroups.length === 0 ? (
              <p className="mt-2 text-xs text-ink/50">{t('modifiers.empty')}</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {form.modifierGroups.map((g, gIdx) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-black/10 bg-white p-3"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        value={g.name}
                        onChange={(e) => updateGroup(gIdx, { name: e.target.value })}
                        placeholder={t('modifiers.groupNamePlaceholder')}
                        className="h-9 flex-1 rounded-lg border border-black/10 bg-white px-2.5 text-sm focus-visible:border-ink/30 focus-visible:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeGroup(gIdx)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`type-${g.id}`}
                          checked={g.selectionType === 'single'}
                          onChange={() => updateGroup(gIdx, { selectionType: 'single' })}
                          className="h-3.5 w-3.5"
                        />
                        {t('modifiers.single')}
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`type-${g.id}`}
                          checked={g.selectionType === 'multiple'}
                          onChange={() => updateGroup(gIdx, { selectionType: 'multiple' })}
                          className="h-3.5 w-3.5"
                        />
                        {t('modifiers.multiple')}
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={g.required}
                          onChange={(e) => updateGroup(gIdx, { required: e.target.checked })}
                          className="h-3.5 w-3.5"
                        />
                        {t('modifiers.required')}
                      </label>
                      {g.selectionType === 'multiple' && (
                        <label className="inline-flex items-center gap-1.5">
                          {t('modifiers.maxLabel')}
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, g.options.length)}
                            value={g.max}
                            onChange={(e) =>
                              updateGroup(gIdx, { max: Number(e.target.value) || 1 })
                            }
                            className="h-7 w-14 rounded-md border border-black/10 px-1.5 text-xs"
                          />
                        </label>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5">
                      {g.options.map((o, oIdx) => (
                        <div key={o.id} className="flex items-center gap-1.5">
                          <input
                            value={o.name}
                            onChange={(e) =>
                              updateOption(gIdx, oIdx, { name: e.target.value })
                            }
                            placeholder={t('modifiers.optionNamePlaceholder')}
                            className="h-9 flex-1 rounded-lg border border-black/10 bg-white px-2.5 text-sm focus-visible:border-ink/30 focus-visible:outline-none"
                          />
                          <input
                            value={o.priceDelta}
                            onChange={(e) =>
                              updateOption(gIdx, oIdx, {
                                priceDelta: Number(e.target.value) || 0,
                              })
                            }
                            type="number"
                            step="0.01"
                            placeholder="+0.00"
                            className="h-9 w-20 rounded-lg border border-black/10 bg-white px-2 text-right text-sm focus-visible:border-ink/30 focus-visible:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(gIdx, oIdx)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            aria-label={t('common.delete')}
                            disabled={g.options.length === 1}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(gIdx)}
                        className="mt-1 inline-flex items-center gap-1 self-start rounded-lg bg-black/5 px-2.5 py-1.5 text-xs font-medium text-ink/70 hover:bg-black/10"
                      >
                        <Plus size={12} /> {t('modifiers.addOption')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
