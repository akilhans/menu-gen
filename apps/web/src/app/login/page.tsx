'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRight, QrCode } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useT } from '@/i18n/I18nProvider';

function LoginForm() {
  const { login } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label={t('auth.fields.email')}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label={t('auth.fields.password')}
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" loading={loading} size="lg" className="mt-2">
        {t('auth.login.submit')} <ArrowRight size={16} />
      </Button>
    </form>
  );
}

function LoginInner() {
  const { t } = useT();
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper">
              <QrCode size={16} />
            </div>
            <span className="font-semibold tracking-tight">menu-gen</span>
          </Link>
          <LanguageSwitcher compact />
        </div>
        <h1 className="font-display text-3xl tracking-tight">{t('auth.login.title')}</h1>
        <p className="mt-1 text-sm text-ink/60">{t('auth.login.subtitle')}</p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-sm text-ink/60">
          {t('auth.login.noAccount')}{' '}
          <Link href="/register" className="font-medium text-ink underline underline-offset-2">
            {t('auth.login.createOne')}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
}
