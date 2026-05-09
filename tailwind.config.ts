import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#009B4D',
          dark: '#007A3D',
          light: '#00B95B',
        },
        secondary: {
          DEFAULT: '#FFCC00',
          dark: '#E6B800',
          light: '#FFD633',
        },
        accent: {
          DEFAULT: '#FFCC00',
          light: '#FFE066',
          dark: '#E6B800',
        },
        ivory: '#FAF5E9',
        forest: {
          100: '#E8F5E9',
          300: '#81C784',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        cream: {
          100: '#FAF5E9',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        'hover': '0 12px 40px 0 rgba(0, 155, 77, 0.15)',
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
};

export default config;
