import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#292524',
          income: '#059669',
          expense: '#e11d48',
          warning: '#d97706',
          info: '#0284c7',
          bg: '#fafaf9',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config
