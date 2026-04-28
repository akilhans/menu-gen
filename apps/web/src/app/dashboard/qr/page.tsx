'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Hash,
  Printer,
  Table2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Restaurant } from '@menu-gen/shared';
import { api, PUBLIC_API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useT } from '@/i18n/I18nProvider';

const MAX_BULK = 60;

export default function QrPage() {
  const { t } = useT();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [generalDataUrl, setGeneralDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Per-table single
  const [tableLabel, setTableLabel] = useState('1');
  const [tableDataUrl, setTableDataUrl] = useState<string>('');

  // Bulk
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(10);
  const [bulkBusy, setBulkBusy] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const generalUrl = useMemo(
    () => (restaurant ? `${siteUrl}/menu/${restaurant.slug}` : ''),
    [restaurant, siteUrl]
  );

  const tableUrl = useMemo(() => {
    if (!restaurant || !tableLabel.trim()) return '';
    return `${siteUrl}/menu/${restaurant.slug}?table=${encodeURIComponent(tableLabel.trim())}`;
  }, [restaurant, siteUrl, tableLabel]);

  useEffect(() => {
    api.getMyRestaurant().then(({ restaurant }) => setRestaurant(restaurant));
  }, []);

  // Generate QRs on the client so previews are instant.
  useEffect(() => {
    if (!generalUrl) return;
    QRCode.toDataURL(generalUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
      color: { dark: '#111111', light: '#FFFFFF' },
    }).then(setGeneralDataUrl);
  }, [generalUrl]);

  useEffect(() => {
    if (!tableUrl) {
      setTableDataUrl('');
      return;
    }
    QRCode.toDataURL(tableUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
      color: { dark: '#111111', light: '#FFFFFF' },
    }).then(setTableDataUrl);
  }, [tableUrl]);

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('qr.urlCopied'));
    setTimeout(() => setCopied(false), 2000);
  }

  async function printSheet() {
    if (!restaurant) return;
    const from = Math.max(1, Math.floor(bulkFrom));
    const to = Math.max(from, Math.floor(bulkTo));
    if (to - from + 1 > MAX_BULK) {
      toast.error(t('qr.bulkTooMany'));
      return;
    }
    setBulkBusy(true);
    try {
      const tables = Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
      const cards = await Promise.all(
        tables.map(async (label) => {
          const url = `${siteUrl}/menu/${restaurant.slug}?table=${encodeURIComponent(label)}`;
          const dataUrl = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 420,
            color: { dark: '#111111', light: '#FFFFFF' },
          });
          return { label, dataUrl };
        })
      );
      openPrintWindow({
        restaurantName: restaurant.name,
        themeColor: restaurant.themeColor || '#FF5A1F',
        cards,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink/50">{t('qr.section')}</p>
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          {t('qr.title')}
        </h1>
        <p className="mt-1 text-sm text-ink/60">{t('qr.subtitle')}</p>
      </div>

      {/* General */}
      <Card className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center">
        <div className="flex flex-col items-center gap-3">
          {generalDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={generalDataUrl}
              alt="General QR"
              className="h-48 w-48 rounded-2xl border border-black/5 bg-white p-3"
            />
          ) : (
            <div className="h-48 w-48 animate-pulse rounded-2xl bg-black/5" />
          )}
          <div className="flex gap-2">
            <a
              href={`${PUBLIC_API_URL}/api/qr/download.png`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper hover:bg-ink-soft"
            >
              <Download size={12} /> PNG
            </a>
            <a
              href={`${PUBLIC_API_URL}/api/qr/download.svg`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium hover:bg-black/5"
            >
              <Download size={12} /> SVG
            </a>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight">{t('qr.generalTitle')}</h2>
            <p className="mt-1 text-sm text-ink/60">{t('qr.generalDesc')}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-paper p-2 pl-4">
            <span className="flex-1 truncate font-mono text-xs">{generalUrl || '—'}</span>
            <Button size="sm" variant="outline" onClick={() => copyUrl(generalUrl)}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? t('qr.copied') : t('qr.copy')}
            </Button>
          </div>
          {generalUrl && (
            <Link
              href={generalUrl}
              target="_blank"
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-ink/70 underline underline-offset-2 hover:text-ink"
            >
              {t('qr.openPublic')} <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </Card>

      {/* Per-table */}
      <Card className="flex flex-col gap-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand">
              <Table2 size={14} />
            </div>
            <h2 className="font-display text-xl tracking-tight">{t('qr.tableTitle')}</h2>
          </div>
          <p className="mt-2 text-sm text-ink/60">{t('qr.tableDesc')}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-[auto,1fr] md:items-center">
          <div className="flex flex-col items-center gap-3">
            {tableDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tableDataUrl}
                alt={`Table ${tableLabel} QR`}
                className="h-44 w-44 rounded-2xl border border-black/5 bg-white p-3"
              />
            ) : (
              <div className="grid h-44 w-44 place-items-center rounded-2xl border border-dashed border-black/10 bg-black/5 text-xs text-ink/40">
                <Hash size={16} />
              </div>
            )}
            <p className="text-xs font-mono text-ink/50">
              {t('orders.table', { table: tableLabel || '—' })}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              label={t('qr.tableLabel')}
              placeholder={t('qr.tablePlaceholder')}
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
              maxLength={20}
            />
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-paper p-2 pl-4">
              <span className="flex-1 truncate font-mono text-xs">{tableUrl || '—'}</span>
              <Button size="sm" variant="outline" onClick={() => copyUrl(tableUrl)} disabled={!tableUrl}>
                <Copy size={12} /> {t('qr.copy')}
              </Button>
            </div>
            <div className="flex gap-2">
              <a
                href={`${PUBLIC_API_URL}/api/qr/download.png?table=${encodeURIComponent(tableLabel.trim())}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper hover:bg-ink-soft aria-disabled:opacity-50"
                aria-disabled={!tableLabel.trim()}
                onClick={(e) => {
                  if (!tableLabel.trim()) e.preventDefault();
                }}
              >
                <Download size={12} /> PNG
              </a>
              <a
                href={`${PUBLIC_API_URL}/api/qr/download.svg?table=${encodeURIComponent(tableLabel.trim())}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium hover:bg-black/5 aria-disabled:opacity-50"
                aria-disabled={!tableLabel.trim()}
                onClick={(e) => {
                  if (!tableLabel.trim()) e.preventDefault();
                }}
              >
                <Download size={12} /> SVG
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-black/5 text-ink/70">
            <Printer size={14} />
          </div>
          <h2 className="font-display text-xl tracking-tight">{t('qr.bulk')}</h2>
        </div>
        <p className="text-sm text-ink/60">{t('qr.bulkDesc')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label={t('qr.bulkFrom')}
            type="number"
            min={1}
            value={bulkFrom}
            onChange={(e) => setBulkFrom(Number(e.target.value))}
            className="w-24"
          />
          <Input
            label={t('qr.bulkTo')}
            type="number"
            min={1}
            value={bulkTo}
            onChange={(e) => setBulkTo(Number(e.target.value))}
            className="w-24"
          />
          <Button onClick={printSheet} loading={bulkBusy} disabled={!restaurant}>
            <Printer size={14} /> {t('qr.bulkGenerate')}
          </Button>
        </div>
      </Card>

      {/* Tips */}
      <Card>
        <h3 className="text-sm font-medium">{t('qr.tips')}</h3>
        <ul className="mt-3 space-y-2 text-sm text-ink/70">
          <li>• {t('qr.tip1')}</li>
          <li>• {t('qr.tip2')}</li>
          <li>• {t('qr.tip3')}</li>
        </ul>
      </Card>
    </div>
  );
}

function openPrintWindow({
  restaurantName,
  themeColor,
  cards,
}: {
  restaurantName: string;
  themeColor: string;
  cards: Array<{ label: string; dataUrl: string }>;
}) {
  const w = window.open('', '_blank');
  if (!w) return;
  const cardsHtml = cards
    .map(
      (c) => `
      <div class="card">
        <div class="header" style="background:${themeColor}">
          <span class="brand">${escapeHtml(restaurantName)}</span>
          <span class="label">№ ${escapeHtml(c.label)}</span>
        </div>
        <img src="${c.dataUrl}" alt="QR ${escapeHtml(c.label)}" />
        <p class="scan">Scan to order · Table ${escapeHtml(c.label)}</p>
      </div>`
    )
    .join('');
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(restaurantName)} — QR sheet</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #F7F5F0; color: #0E0E10; font-family: Inter, system-ui, sans-serif; }
  .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14mm; padding: 14mm; }
  .card {
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
    text-align: center;
    break-inside: avoid;
  }
  .header {
    color: white;
    padding: 8px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .brand { text-transform: uppercase; }
  .label { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  img { display: block; width: 100%; height: auto; padding: 10px 14px 4px; }
  .scan { margin: 4px 0 12px; font-size: 10px; color: rgba(14,14,16,0.55); letter-spacing: 0.02em; }
  @page { size: A4; margin: 0; }
  @media print {
    body { background: white; }
  }
</style>
</head>
<body>
<div class="sheet">${cardsHtml}</div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 200));</script>
</body>
</html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}
