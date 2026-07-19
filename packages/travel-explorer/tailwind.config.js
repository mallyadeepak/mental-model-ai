/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f5f3',
          100: '#e8e5df',
          200: '#d3ccc0',
          300: '#b6a992',
          400: '#9a8768',
          500: '#83704f',
          600: '#6b5940',
          700: '#544636',
          800: '#3a3025',
          900: '#231d17',
          950: '#151009',
        },
        sunset: {
          50: '#fff4ed',
          100: '#ffe4d2',
          200: '#ffc6a3',
          300: '#ff9d64',
          400: '#ff7233',
          500: '#f8500f',
          600: '#e2380a',
          700: '#bb280c',
          800: '#952211',
          900: '#791f12',
        },
        teal: {
          50: '#eefbfa',
          100: '#d3f4f2',
          200: '#aae8e5',
          300: '#75d5d2',
          400: '#3fb9b7',
          500: '#249d9c',
          600: '#1a7d7f',
          700: '#186567',
          800: '#185154',
          900: '#174548',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
