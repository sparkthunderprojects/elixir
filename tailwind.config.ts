import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Sora Variable"', 'system-ui', 'sans-serif'] },
      colors: {
        page: '#f4f0ec',
        navy: '#1d3557',
        deep: '#0f1a30',
        body: '#3f4a5e',
        elixir: { DEFAULT: '#bd3141', dark: '#9d2634', light: '#e0525f' },
        coral: '#ff876f',
        sun: '#ffd22e',
        mint: '#12c791',
        tangerine: '#ef7d00',
        danger: { 50: '#fef2f2', 100: '#fee2e2', 300: '#fca5a5', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        success: { 50: '#ecfdf5', 100: '#d1fae5', 300: '#6ee7b7', 500: '#10b981', 600: '#059669', 700: '#047857' },
        warning: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};
export default config;
