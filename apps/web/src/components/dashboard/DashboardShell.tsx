'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  Settings,
  LogOut,
  Menu as MenuIcon,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useT } from '@/i18n/I18nProvider';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: t('nav.overview'), icon: LayoutDashboard },
    { href: '/dashboard/orders', label: t('nav.orders'), icon: Receipt },
    { href: '/dashboard/menu', label: t('nav.menu'), icon: UtensilsCrossed },
    { href: '/dashboard/qr', label: t('nav.qr'), icon: QrCode },
    { href: '/dashboard/settings', label: t('nav.settings'), icon: Settings },
  ];

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper">
      {/* Top nav (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-paper/80 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper">
            <MenuIcon size={16} />
          </div>
          <span className="font-semibold">menu-gen</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <button
            onClick={logout}
            className="rounded-lg p-2 text-ink/60 hover:text-ink"
            aria-label={t('nav.logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6 md:py-10">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-10 hidden h-[calc(100dvh-5rem)] w-60 shrink-0 flex-col gap-1 md:flex">
          <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-paper">
              <QrCode size={16} />
            </div>
            <span className="font-semibold tracking-tight">menu-gen</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-ink text-paper'
                      : 'text-ink/70 hover:bg-black/5 hover:text-ink'
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <LanguageSwitcher />
            <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="truncate text-xs text-ink/50">{user.email}</p>
              <button
                onClick={logout}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-ink"
              >
                <LogOut size={14} /> {t('nav.logout')}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-black/5 bg-paper/90 backdrop-blur safe-bottom md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]',
                active ? 'text-ink' : 'text-ink/50'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
