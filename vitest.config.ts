import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: false,
    include: ['apps/**/*.{test,spec}.{ts,tsx}', 'packages/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    environmentMatchGlobs: [
      ['apps/web/**', 'jsdom'],
      ['apps/api/**', 'node'],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      '@menu-gen/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  },
});
