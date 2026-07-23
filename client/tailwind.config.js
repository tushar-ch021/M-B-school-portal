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
          50: '#f4f6fa',
          100: '#e7f0fa',
          200: '#c5daf3',
          600: '#2a5a9e',
          700: '#224a82',
          800: '#1d3f6f',
          900: '#1b3a6b', // School Primary Navy
          950: '#122749',
        },
        schoolGreen: {
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
          800: '#2e7d32', // School Secondary Green
          850: '#276b2b',
          900: '#14532d',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          150: '#fecaca',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          650: '#c62828',
          700: '#b91c1c',
          750: '#991b1b',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          150: '#eaecef',
          200: '#e5e7eb',
          250: '#d1d5db',
          300: '#d1d5db',
          350: '#b8bcc4',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'lg': '8px',
        'card': '10px'
      },
      boxShadow: {
        'flat': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
        'premium': '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02)',
        'xs': '0 1px 2px 0 rgba(0,0,0,0.05)',
      },
      outline: {
        'hidden': 'none',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
