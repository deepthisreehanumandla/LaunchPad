import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f1ff',
          100: '#e9e5ff',
          200: '#d6cdff',
          300: '#b8a6ff',
          400: '#9576f2',
          500: '#6c4de6',
          600: '#5a3ad1',
          700: '#472bab',
          800: '#382488',
          900: '#2c1c68',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        lg: '10px',
        md: '8px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 15 20 / 0.04)',
        soft: '0 1px 2px rgb(15 15 20 / 0.04), 0 2px 8px rgb(15 15 20 / 0.04)',
        card: '0 1px 2px rgb(15 15 20 / 0.03), 0 4px 16px rgb(15 15 20 / 0.05)',
        popover: '0 4px 12px rgb(15 15 20 / 0.06), 0 12px 32px rgb(15 15 20 / 0.10)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        fadeInUp: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        scaleIn: 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
