'use client';

import Link from 'next/link';
import { ArrowRight, QrCode } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavProps {
  links: NavLink[];
  loginLabel: string;
  signupLabel: string;
}

export function Nav({ links, loginLabel, signupLabel }: NavProps) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 md:pt-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper">
          <QrCode size={16} />
        </div>
        <span className="font-semibold tracking-tight">menu-gen</span>
      </Link>
      <nav className="hidden gap-6 text-sm text-ink/70 md:flex">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-ink">
            {l.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcher compact />
        <Link
          href="/login"
          className="hidden rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:text-ink md:inline-flex"
        >
          {loginLabel}
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
        >
          {signupLabel} <ArrowRight size={14} />
        </Link>
      </div>
    </header>
  );
}
