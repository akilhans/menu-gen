import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { Restaurant } from '../models/Restaurant';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

function getTable(req: Request): string | undefined {
  const raw = req.query.table;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().slice(0, 20);
  return trimmed || undefined;
}

function publicMenuUrl(slug: string, table?: string) {
  const base = `${env.publicWebUrl.replace(/\/$/, '')}/menu/${slug}`;
  return table ? `${base}?table=${encodeURIComponent(table)}` : base;
}

function qrFilename(slug: string, table: string | undefined, ext: string) {
  return table ? `${slug}-table-${table}-qr.${ext}` : `${slug}-qr.${ext}`;
}

export async function getQrInfo(req: Request, res: Response) {
  const restaurant = await Restaurant.findOne({ owner: req.userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');
  const table = getTable(req);
  const url = publicMenuUrl(restaurant.slug, table);
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
    color: { dark: '#111111', light: '#FFFFFF' },
  });
  res.json({ url, dataUrl, table: table ?? null });
}

export async function getQrPng(req: Request, res: Response) {
  const restaurant = await Restaurant.findOne({ owner: req.userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');
  const table = getTable(req);
  const url = publicMenuUrl(restaurant.slug, table);
  const buffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 1024,
    color: { dark: '#111111', light: '#FFFFFF' },
  });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${qrFilename(restaurant.slug, table, 'png')}"`
  );
  res.send(buffer);
}

export async function getQrSvg(req: Request, res: Response) {
  const restaurant = await Restaurant.findOne({ owner: req.userId });
  if (!restaurant) throw HttpError.notFound('Restaurant not found');
  const table = getTable(req);
  const url = publicMenuUrl(restaurant.slug, table);
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#111111', light: '#FFFFFF' },
  });
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${qrFilename(restaurant.slug, table, 'svg')}"`
  );
  res.send(svg);
}
