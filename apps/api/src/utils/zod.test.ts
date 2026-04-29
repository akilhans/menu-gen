import { describe, expect, it } from 'vitest';
import { safeUrl } from './zod';

describe('safeUrl', () => {
  const schema = safeUrl();

  it.each([
    'https://example.com',
    'http://example.com/path?q=1',
    'https://sub.example.com:8443/path#hash',
  ])('accepts %s', (v) => {
    expect(schema.safeParse(v).success).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>',
    'vbscript:msgbox',
    'file:///etc/passwd',
    'ftp://example.com',
  ])('rejects %s', (v) => {
    expect(schema.safeParse(v).success).toBe(false);
  });

  it('rejects malformed strings', () => {
    expect(schema.safeParse('not a url').success).toBe(false);
    expect(schema.safeParse('').success).toBe(false);
  });
});
