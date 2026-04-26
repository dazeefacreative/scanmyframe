import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  important: true,
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'charcoal-black': '#0F0F0E',
        primary: '#0F4C3A',
        secondary: '#FAF5DD',
        gold: '#D4AF37',
        white: '#ffffff',
        'third-option': '#A0C28A',
        gray: '#f3f3f3',
        dark: '#333',
        link: '#2353E2',
        'link-hover': '#0f7ab4',
      },
      fontFamily: {
        montserrat: ["'Montserrat Alternates'", ...fontFamily.sans],
        poltawski: ["'Poltawski Nowy'", ...fontFamily.serif],
      },
    },
  },
  plugins: [],
};
