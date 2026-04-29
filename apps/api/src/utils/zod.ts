import { z } from 'zod';

/**
 * `z.string().url()` accepts `javascript:`, `data:`, `vbscript:`, etc., which
 * is fatal when the URL is later injected into href/src/style. Restrict to
 * http/https.
 */
export const safeUrl = () =>
  z
    .string()
    .url()
    .refine(
      (v) => {
        try {
          const u = new URL(v);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'URL must use http or https' }
    );
