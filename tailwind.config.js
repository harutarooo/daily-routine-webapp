/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui','-apple-system','BlinkMacSystemFont','"Helvetica Neue"','Arial','"Noto Sans JP"','sans-serif'],
      },
      colors: {
        grayScale: {
          1: '#f5f5f5',
          2: '#e5e5e5',
          3: '#d4d4d4',
          4: '#a3a3a3',
          5: '#8c8c8c',
          6: '#737373',
          7: '#525252',
          8: '#404040',
          9: '#262626',
          10: '#171717'
        }
      }
    },
  },
  plugins: [],
}
