/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F8FAFC',
        card: '#FFFFFF',
        input: '#F1F5F9',
        elevated: '#F1F5F9',
        border: '#E2E8F0',
        'border-light': '#CBD5E1',
        primary: '#0F172A',
        'primary-dark': '#1E293B',
        secondary: '#F1F5F9',
        danger: '#E11D48',
        income: '#0F172A',
        expense: '#E11D48',
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
