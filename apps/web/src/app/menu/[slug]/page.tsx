import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicMenuResponse } from '@menu-gen/shared';
import { CustomerMenu } from '@/components/menu/CustomerMenu';

export const dynamic = 'force-dynamic';

async function fetchMenu(slug: string): Promise<PublicMenuResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/api/public/menu/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicMenuResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await fetchMenu(params.slug);
  if (!data) return { title: 'Menu not found' };
  return {
    title: `${data.restaurant.name} · Menu`,
    description: data.restaurant.description ?? `Menu for ${data.restaurant.name}.`,
    openGraph: {
      title: data.restaurant.name,
      description: data.restaurant.description ?? undefined,
      images: data.restaurant.coverUrl ? [data.restaurant.coverUrl] : undefined,
      type: 'website',
    },
  };
}

export default async function PublicMenuPage({ params }: { params: { slug: string } }) {
  const data = await fetchMenu(params.slug);
  if (!data) notFound();
  return (
    <Suspense fallback={<div className="h-dvh bg-paper" />}>
      <CustomerMenu data={data} />
    </Suspense>
  );
}
