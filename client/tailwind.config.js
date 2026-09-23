/** Colors and radius come from CSS variables that the app sets from Admin → Settings → Theme. */
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const scale = (name) => ({
  DEFAULT: `rgb(var(--color-${name}-600) / <alpha-value>)`,
  ...Object.fromEntries(shades.map((s) => [s, `rgb(var(--color-${name}-${s}) / <alpha-value>)`])),
});

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: scale('primary'),
        secondary: scale('secondary'),
        accent: scale('accent'),
      },
      borderRadius: {
        md: 'calc(var(--radius) * 0.66)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) * 1.35)',
        '2xl': 'calc(var(--radius) * 1.8)',
        '3xl': 'calc(var(--radius) * 2.4)',
      },
      fontFamily: {
        sans: ['Inter', '"Hind Siliguri"', '"Noto Sans Bengali"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgb(15 23 42 / 0.18)',
        glow: '0 20px 45px -18px rgb(var(--color-primary-600) / 0.45)',
      },
    },
  },
  plugins: [],
};
