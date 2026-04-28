import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0E0E10',
          soft: '#1A1A1F',
          muted: '#7A7A85',
        },
        paper: {
          DEFAULT: '#F7F5F0',
          soft: '#FBFAF6',
        },
        brand: {
          DEFAULT: '#FF5A1F',
          soft: '#FFE2D3',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(14,14,16,0.04), 0 24px 48px -24px rgba(14,14,16,0.12)',
        soft: '0 1px 2px rgba(14,14,16,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
