/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zinc: {
          950: '#09090B',
          900: '#141417',
          850: '#1C1C21',
          800: '#27272A',
          700: '#3F3F46',
          600: '#52525B',
          500: '#71717A',
          400: '#A1A1AA',
          300: '#D4D4D8',
          200: '#E4E4E7',
          100: '#F4F4F5',
          50: '#FAFAFA',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
