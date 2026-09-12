/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F19',
        card: '#111827',
        input: '#1F2937',
        elevated: '#1F2937',
        border: '#1F2937',
        'border-light': '#374151',
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        'primary-light': '#60A5FA',
        secondary: '#1E293B',
        danger: '#EF4444',
        income: '#10B981',
        expense: '#EF4444',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
