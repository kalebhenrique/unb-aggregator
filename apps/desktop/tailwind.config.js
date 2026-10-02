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
          blue: '#2563EB',
          blueHover: '#1D4ED8',
          danger: '#DC2626',
          dangerHover: '#B91C1C',
          yellow: '#FFE600',
          yellowHover: '#F2DA00',
          green: '#46E297',
          greenHover: '#39D68A',
          coral: '#FF6B6B',
          purple: '#C084FC',
        },
        ink: {
          success: '#15803D',
          error: '#B91C1C',
        },
        platform: {
          sigaa: '#46E297',
          aprender3: '#FB923C',
          moodlemat: '#C084FC',
          teams: '#60A5FA',
        },
        pastel: {
          blue: '#EBF3FF',
          green: '#E6F8EE',
          yellow: '#FFF9D2',
          purple: '#F3E8FF',
          red: '#FFEBEB',
          orange: '#FFEDD5',
          sky: '#E0F2FE',
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
