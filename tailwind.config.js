/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b9fc',
          400: '#8193f8',
          500: '#6370f1',
          600: '#4f52e5',
          700: '#4040ca',
          800: '#3535a3',
          900: '#1e293b',
          950: '#0f172a'
        }
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.85rem' }],
        xs: ['0.72rem', { lineHeight: '1rem' }],
        sm: ['0.8rem', { lineHeight: '1.15rem' }],
        base: ['0.875rem', { lineHeight: '1.3rem' }]
      },
      spacing: {
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        68: '17rem',
        72: '18rem',
        76: '19rem'
      },
      borderRadius: {
        DEFAULT: '0.375rem'
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        dropdown: '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.06)'
      }
    }
  },
  plugins: []
}
