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

function RegisterForm() {
  const { register } = useAuth();
  const { t } = useT();
  const [form, setForm] = useState({
    name: '',
    restaurantName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success(t('auth.welcome'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.errors.registerFailed'));
    } finally {
      setLoading(false);
    }
  }

  const bind = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value })),
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label={t('auth.fields.name')} required autoComplete="name" {...bind('name')} />
      <Input label={t('auth.fields.restaurantName')} required {...bind('restaurantName')} />
      <Input
        label={t('auth.fields.email')}
        type="email"
        required
        autoComplete="email"
        {...bind('email')}
      />
      <Input
        label={t('auth.fields.password')}
        type="password"
        required
        minLength={8}
        hint={t('auth.fields.passwordHint')}
        autoComplete="new-password"
        {...bind('password')}
      />
      <Button type="submit" loading={loading} size="lg" className="mt-2">
        {t('auth.register.submit')} <ArrowRight size={16} />
      </Button>
    </form>
  );
}

function RegisterInner() {
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
        <h1 className="font-display text-3xl tracking-tight">{t('auth.register.title')}</h1>
        <p className="mt-1 text-sm text-ink/60">{t('auth.register.subtitle')}</p>
        <div className="mt-8">
          <RegisterForm />
        </div>
        <p className="mt-6 text-sm text-ink/60">
          {t('auth.register.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-ink underline underline-offset-2">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterInner />
    </AuthProvider>
  );
}
