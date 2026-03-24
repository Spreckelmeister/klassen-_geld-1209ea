import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1e293b',
          'primary-light': '#334155',
          income: '#10b981',
          'income-light': '#d1fae5',
          expense: '#f43f5e',
          'expense-light': '#ffe4e6',
          warning: '#f59e0b',
          'warning-light': '#fef3c7',
          info: '#3b82f6',
          'info-light': '#dbeafe',
          bg: '#f8fafc',
          'bg-card': '#ffffff',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        xl: '0.75rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'balance': '0 10px 25px -5px rgb(0 0 0 / 0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config
