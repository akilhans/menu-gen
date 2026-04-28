import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '@/i18n/I18nProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: { default: 'menu-gen — QR menus for restaurants', template: '%s · menu-gen' },
  description:
    'Create a beautiful digital menu in minutes. Share with a QR code. Built for modern restaurants.',
  openGraph: {
    title: 'menu-gen',
    description: 'Beautiful QR menus for restaurants.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F7F5F0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <I18nProvider>{children}</I18nProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0E0E10',
              color: '#F7F5F0',
              borderRadius: 12,
              fontSize: 14,
            },
          }}
        />
      </body>
    </html>
  );
}
