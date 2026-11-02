/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#242E25',
          dark: '#1A221B',
          light: '#2E3B2F',
        },
        sage: {
          DEFAULT: '#8AAB8F',
          light: '#A3BFA7',
          dark: '#739578',
        },
        mint: {
          DEFAULT: '#D3E8D6',
          light: '#E6F3E8',
          dark: '#B8D7BC',
        },
        mutedgreen: {
          DEFAULT: '#7C827C',
          light: '#9DA39D',
          dark: '#5E645E',
        },
        brand: {
          bg: '#F7F9F7',
          card: '#FFFFFF',
          border: '#E7ECE7',
          primary: '#242E25',
          secondary: '#7C827C',
          success: '#43845A',
          warning: '#D99A42',
          error: '#D9534F',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '18px',
        'card-lg': '22px',
        'card-sm': '14px',
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(36, 46, 37, 0.05), 0 1px 4px -1px rgba(36, 46, 37, 0.03)',
        'card': '0 4px 16px -4px rgba(36, 46, 37, 0.06), 0 2px 6px -2px rgba(36, 46, 37, 0.04)',
        'float': '0 10px 25px -5px rgba(36, 46, 37, 0.12), 0 8px 10px -6px rgba(36, 46, 37, 0.08)',
        'nav': '0 -4px 16px -2px rgba(36, 46, 37, 0.05)',
      }
    },
  },
  plugins: [],
}

