/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        unb: {
          green: '#006633',
          blue: '#003366',
          yellow: '#FFE600',
        },
        platform: {
          sigaa: '#22C55E',
          aprender3: '#FB923C',
          moodlemat: '#C084FC',
          teams: '#60A5FA',
        },
        cream: '#FAF7EE',
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo': '4px 4px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
