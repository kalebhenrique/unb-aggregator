/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        unb: {
          green: '#006633',
          blue: '#468AFB',
          yellow: '#FFE600',
        },
        neo: {
          blue: '#468AFB',
          blueHover: '#3574DC',
          yellow: '#FFE600',
          green: '#46E297',
          coral: '#FF6B6B',
          purple: '#C084FC',
        },
        platform: {
          sigaa: '#46E297',
          aprender3: '#FB923C',
          moodlemat: '#C084FC',
          teams: '#60A5FA',
        },
        canvas: '#E8EFF8',
        cream: '#FAF7EE',
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo': '4px 4px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
      },
    },
  },
  plugins: [],
};
