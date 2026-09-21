/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './auth/**/*.html',
    './download/**/*.html',
    './showcase/**/*.html',
    './studio/**/*.html',
    './terms/**/*.html',
    './privacy/**/*.html',
    './*.js'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'sticker-yellow': '#FFE600',
        'sticker-pink': '#FF4D94',
        'sticker-blue': '#407BFF',
        'sticker-green': '#2ECC71',
        'sticker-orange': '#FF9F43',
        'paper-white': '#FFFFFF',
        'grid-blue': '#D1E9FF'
      },
      fontFamily: {
        display: ['Fredoka', 'sans-serif'],
        handwritten: ['Caveat', 'cursive']
      },
      boxShadow: {
        sticker: '8px 8px 0 0 rgba(0, 0, 0, 1)',
        'sticker-sm': '4px 4px 0 0 rgba(0, 0, 0, 1)',
        'card-stack': '12px 12px 0 0 rgba(0, 0, 0, 0.15)'
      }
    }
  },
  plugins: []
};
