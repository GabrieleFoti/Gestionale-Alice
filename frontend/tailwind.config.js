/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'nighty': ['Nighty', 'sans-serif'],
        'gluten': ['Gluten', 'sans-serif'],
      },
      colors: {
        'brand-bg': {
            '50': '#fafafa',
            '100': '#f5f5f5',
            '200': '#e6e6e6',
            '300': '#cccccc',
            '400': '#a3a3a3',
            '500': '#727272',
            '600': '#535353',
            '700': '#404040',
            '800': '#272727',
            '900': '#1a1a1a',
            '950': '#0b0b0b',
        },
        'brand-text': {
          '50': '#fafafa',
          '100': '#f5f5f5',
          '200': '#e6e6e6',
          '300': '#d3d3d3',
          '400': '#a3a3a3',
          '500': '#727272',
          '600': '#535353',
          '700': '#404040',
          '800': '#272727',
          '900': '#1a1a1a',
          '950': '#0b0b0b',
      },

      },
    },
  },
  plugins: [],
}
