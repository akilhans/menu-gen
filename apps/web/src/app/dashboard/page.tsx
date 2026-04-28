'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, QrCode, UtensilsCrossed, Eye } from 'lucide-react';
import type { Restaurant, Category, MenuItem } from '@menu-gen/shared';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { useT } from '@/i18n/I18nProvider';

export default function OverviewPage() {
  const { t } = useT();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMyRestaurant(), api.listCategories(), api.listItems()])
      .then(([r, c, i]) => {
        setRestaurant(r.restaurant);
        setCategories(c.categories);
        setItems(i.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const menuUrl = restaurant ? `${siteUrl}/menu/${restaurant.slug}` : '';

  if (loading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-black/5" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-ink/50">{t('dash.section')}</p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            {t('dash.hi')}{restaurant ? `, ${restaurant.name}` : ''} 👋
          </h1>
        </div>
        {restaurant && (
          <Link
            href={`/menu/${restaurant.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/5"
          >
            <Eye size={14} /> {t('common.preview')}
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('dash.stats.categories')} value={categories.length} icon={<UtensilsCrossed size={16} />} />
        <StatCard label={t('dash.stats.items')} value={items.length} icon={<UtensilsCrossed size={16} />} />
        <StatCard
          label={t('dash.stats.available')}
          value={items.filter((i) => i.available).length}
          icon={<Eye size={16} />}
        />
      </div>

      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-ink/50">
            {t('dash.publicUrl')}
          </p>
          <p className="mt-1 truncate font-mono text-sm text-ink">{menuUrl || '—'}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/qr"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
          >
            <QrCode size={14} /> {t('dash.getQr')}
          </Link>
          <Link
            href="/dashboard/menu"
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            {t('dash.editMenu')} <ArrowUpRight size={14} />
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-xl tracking-tight">{t('dash.started.title')}</h2>
        <ol className="mt-4 space-y-3 text-sm">
          {[
            { done: categories.length > 0, text: t('dash.started.addCategory') },
            { done: items.length > 0, text: t('dash.started.addItems') },
            { done: true, text: t('dash.started.preview') },
            { done: true, text: t('dash.started.print') },
          ].map((s, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                  s.done ? 'bg-ink text-paper' : 'bg-black/5 text-ink/60'
                }`}
              >
                {idx + 1}
              </span>
              <span className={s.done ? 'text-ink' : 'text-ink/60'}>{s.text}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{label}</p>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-black/5 text-ink/70">{icon}</div>
      </div>
      <p className="mt-3 font-display text-4xl tracking-tight">{value}</p>
    </Card>
  );
}
