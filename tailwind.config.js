/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#EEF2FF',
        card: '#FFFFFF',
        input: '#F0F4FF',
        elevated: '#EEF2FF',
        border: '#DBEAFE',
        'border-light': '#BFDBFE',
        primary: '#1D4ED8',
        'primary-dark': '#1E40AF',
        'primary-light': '#3B82F6',
        secondary: '#EEF2FF',
        danger: '#EF4444',
        income: '#10B981',
        expense: '#EF4444',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-muted': '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
