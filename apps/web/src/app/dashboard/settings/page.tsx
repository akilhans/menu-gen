'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Restaurant } from '@menu-gen/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useT } from '@/i18n/I18nProvider';

export default function SettingsPage() {
  const { t } = useT();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getMyRestaurant()
      .then(({ restaurant }) => setRestaurant(restaurant))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant) return;
    setSaving(true);
    try {
      const { restaurant: updated } = await api.updateMyRestaurant(restaurant);
      setRestaurant(updated);
      toast.success(t('settings.saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('err.failed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !restaurant) {
    return <div className="h-64 animate-pulse rounded-2xl bg-black/5" />;
  }

  const set = <K extends keyof Restaurant>(k: K, v: Restaurant[K]) =>
    setRestaurant((r) => (r ? { ...r, [k]: v } : r));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink/50">{t('settings.section')}</p>
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">{t('settings.title')}</h1>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="font-medium">{t('settings.basics')}</h2>
        <Input
          label={t('settings.restaurantName')}
          value={restaurant.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <Input
          label={t('settings.slug')}
          value={restaurant.slug}
          onChange={(e) => set('slug', e.target.value.toLowerCase())}
          hint={t('settings.slugHint')}
        />
        <Textarea
          label={t('settings.description')}
          value={restaurant.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-medium">{t('settings.branding')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('settings.currency')}
            value={restaurant.currency}
            onChange={(e) => set('currency', e.target.value.toUpperCase())}
            maxLength={3}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink/80">{t('settings.themeColor')}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={restaurant.themeColor}
                onChange={(e) => set('themeColor', e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-black/10"
              />
              <Input
                value={restaurant.themeColor}
                onChange={(e) => set('themeColor', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUpload
            label={t('settings.logo')}
            value={restaurant.logoUrl ?? ''}
            onChange={(url) => set('logoUrl', url)}
            aspect="square"
          />
          <ImageUpload
            label={t('settings.cover')}
            value={restaurant.coverUrl ?? ''}
            onChange={(url) => set('coverUrl', url)}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-medium">{t('settings.contact')}</h2>
        <Input
          label={t('settings.address')}
          value={restaurant.address ?? ''}
          onChange={(e) => set('address', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('settings.phone')}
            value={restaurant.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
          />
          <Input
            label={t('settings.instagram')}
            value={restaurant.instagram ?? ''}
            onChange={(e) => set('instagram', e.target.value)}
            placeholder="@handle"
          />
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end md:bottom-0">
        <Button type="submit" loading={saving} size="lg">
          {t('settings.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
