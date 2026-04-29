import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#15131A',
          soft: '#221F2A',
          muted: '#807A8C',
        },
        paper: {
          DEFAULT: '#F6F2EA',
          soft: '#FBF8F2',
          warm: '#EFE8DA',
        },
        brand: {
          DEFAULT: '#E2461C',
          soft: '#FCDDD0',
          deep: '#9F2A11',
        },
        clay: {
          DEFAULT: '#C2410C',
          soft: '#FBE4D6',
        },
        sage: {
          DEFAULT: '#6B7F62',
          soft: '#E2E8DC',
        },
        ocean: {
          DEFAULT: '#2C5F7C',
          soft: '#D6E3EB',
        },
        plum: {
          DEFAULT: '#5B3A5C',
          soft: '#EADBEA',
        },
        sun: {
          DEFAULT: '#D9A441',
          soft: '#F8EBCB',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 2px 6px rgba(21,19,26,0.04), 0 24px 48px -28px rgba(21,19,26,0.18)',
        soft: '0 1px 2px rgba(21,19,26,0.05)',
        glow: '0 0 0 1px rgba(226,70,28,0.15), 0 14px 30px -10px rgba(226,70,28,0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
