/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rosa: {
          50: '#FFF7FA',
          100: '#FCE4EC',
          200: '#F8BBD0',
          300: '#F48FB1',
          400: '#EC7AA3',
          500: '#D9578A',
          600: '#B83C6E',
          700: '#8E2C54',
          800: '#5E1F38',
        },
        ink: {
          DEFAULT: '#3B2A33',
          soft: '#6E5A64',
          muted: '#9C8A93',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -6px rgba(217, 87, 138, 0.18)',
      },
    },
  },
  plugins: [],
};
