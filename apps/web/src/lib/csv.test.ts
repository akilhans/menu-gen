import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('emits header row + body', () => {
    const out = toCsv([{ a: 1, b: 'two' }], [
      { header: 'a', get: (r) => r.a },
      { header: 'b', get: (r) => r.b },
    ]);
    expect(out).toBe('a,b\r\n1,two');
  });

  it('quotes cells containing commas', () => {
    const out = toCsv([{ x: 'a,b' }], [{ header: 'x', get: (r) => r.x }]);
    expect(out).toBe('x\r\n"a,b"');
  });

  it('escapes embedded double quotes', () => {
    const out = toCsv([{ x: 'she said "hi"' }], [{ header: 'x', get: (r) => r.x }]);
    expect(out).toBe('x\r\n"she said ""hi"""');
  });

  it('quotes cells with newlines', () => {
    const out = toCsv([{ x: 'line1\nline2' }], [{ header: 'x', get: (r) => r.x }]);
    expect(out).toContain('"line1\nline2"');
  });

  it('encodes Date as ISO', () => {
    const d = new Date('2026-01-01T00:00:00Z');
    const out = toCsv([{ d }], [{ header: 'd', get: (r) => r.d }]);
    expect(out).toBe('d\r\n2026-01-01T00:00:00.000Z');
  });

  it('coerces null/undefined to empty', () => {
    const out = toCsv(
      [{ a: null, b: undefined }],
      [
        { header: 'a', get: (r) => r.a },
        { header: 'b', get: (r) => r.b },
      ]
    );
    expect(out).toBe('a,b\r\n,');
  });
});
