/**
 * Tiny CSV utility — escapes quotes, commas, newlines per RFC 4180.
 * No deps; safe for browser download via Blob.
 *
 * Time:  O(rows × cols)
 * Space: O(rows × cols) for the joined string
 */

export type CsvCell = string | number | boolean | null | undefined | Date;

export interface CsvColumn<T> {
  header: string;
  /** Pull a cell value out of `row`. Return any primitive — Date is ISO-encoded. */
  get: (row: T) => CsvCell;
}

const NEEDS_QUOTING = /[",\r\n]/;

function encodeCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  let str: string;
  if (value instanceof Date) str = value.toISOString();
  else str = String(value);
  if (NEEDS_QUOTING.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T>(rows: readonly T[], columns: ReadonlyArray<CsvColumn<T>>): string {
  const head = columns.map((c) => encodeCell(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => encodeCell(c.get(row))).join(','))
    .join('\r\n');
  return `${head}\r\n${body}`;
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
