/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F0F',
        card: '#1A1A1A',
        input: '#242424',
        elevated: '#2A2A2A',
        border: '#2E2E2E',
        'border-light': '#3A3A3A',
        primary: '#A8E6CF',
        'primary-dark': '#6BCF9F',
        secondary: '#FFD3A5',
        danger: '#FF6B6B',
        income: '#A8E6CF',
        expense: '#FF6B6B',
        'text-primary': '#F5F5F5',
        'text-secondary': '#9A9A9A',
        'text-muted': '#5A5A5A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
