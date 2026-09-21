/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          950: '#070A12', // Obsidian void
          900: '#0D1322', // Deep slate surface
          850: '#121A2D', // Elevated card
          800: '#1B253D', // Hover surface
          700: '#2A3859', // Border subtle
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(255, 255, 255, 0.14)',
          'glass-bg': 'rgba(15, 23, 42, 0.65)',
        },
        brand: {
          50: '#EEF2FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          cyan: '#06B6D4',
        },
        income: {
          light: '#34D399',
          DEFAULT: '#10B981',
          dark: '#059669',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        expense: {
          light: '#FB7185',
          DEFAULT: '#F43F5E',
          dark: '#E11D48',
          glow: 'rgba(244, 63, 94, 0.25)',
        },
        tg: {
          bg: 'var(--tg-theme-bg-color, #070A12)',
          'secondary-bg': 'var(--tg-theme-secondary-bg-color, #0D1322)',
          'header-bg': 'var(--tg-theme-header-bg-color, #070A12)',
          'section-bg': 'var(--tg-theme-section-bg-color, #121A2D)',
          'section-header': 'var(--tg-theme-section-header-text-color, #94A3B8)',
          text: 'var(--tg-theme-text-color, #F8FAFC)',
          hint: 'var(--tg-theme-hint-color, #64748B)',
          link: 'var(--tg-theme-link-color, #6366F1)',
          button: 'var(--tg-theme-button-color, #6366F1)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
          destructive: 'var(--tg-theme-destructive-text-color, #F43F5E)',
          accent: 'var(--tg-theme-accent-text-color, #6366F1)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'income-glow': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'expense-glow': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'blob': 'blob 12s infinite ease-in-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
