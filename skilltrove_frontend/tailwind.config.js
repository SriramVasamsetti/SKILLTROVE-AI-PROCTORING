/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        skill: {
          orange: '#ff6a2b',
          red: '#ff4d3f',
          neon: '#ff7f35',
        },
      },
      boxShadow: {
        neon: '0 0 35px rgba(255, 106, 43, 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
