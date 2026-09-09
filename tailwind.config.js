/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F6F7F5',
        card: '#FFFFFF',
        input: '#F8FAFC',
        elevated: '#E8F0FA',
        border: '#DCE5ED',
        'border-light': '#C4D3E1',
        primary: '#123F78',
        'primary-dark': '#1D5FA7',
        secondary: '#E8F0FA',
        danger: '#C92F1C',
        income: '#1D5FA7',
        expense: '#C92F1C',
        'text-primary': '#17324D',
        'text-secondary': '#4E6880',
        'text-muted': '#7890A3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
