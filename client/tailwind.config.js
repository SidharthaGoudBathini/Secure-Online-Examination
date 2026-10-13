/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#142B4F', // Primary Navy
          950: '#0B1728',
        },
        royal: {
          50: '#EDF5FF',
          100: '#D6E7FF',
          200: '#ADCFFF',
          300: '#85B6FE',
          400: '#5C9DFE',
          500: '#3478F6', // Secondary Royal Blue
          600: '#1859D3',
          700: '#1142A0',
          800: '#0B2C6D',
          900: '#05163A',
        },
        surface: '#F5F7FB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
