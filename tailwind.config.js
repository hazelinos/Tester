/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#071314',
        card: '#0D2021',
        input: '#102A2B',
        elevated: '#143335',
        border: '#1B3D3E',
        'border-light': '#285859',
        primary: '#146466',
        'primary-dark': '#5AABA9',
        secondary: '#E2E2C4',
        danger: '#C92F1C',
        income: '#146466',
        expense: '#C92F1C',
        'text-primary': '#E2E2C4',
        'text-secondary': '#AAB8B3',
        'text-muted': '#72817C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
