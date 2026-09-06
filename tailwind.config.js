/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elderly: {
          bg: '#FAF8F5',
          card: '#FFFFFF',
          primary: '#0F766E', // Calm deep teal
          primaryHover: '#115E59',
          accent: '#D97706',  // Warm amber for high-visibility highlights
          softBlue: '#E0F2FE',
          softGreen: '#DCFCE7',
          softAmber: '#FEF3C7',
          textDark: '#1E293B',
          textMuted: '#475569',
          border: '#E2E8F0',
        },
        caregiver: {
          primary: '#1E3A8A', // Trustworthy deep royal blue
          primaryHover: '#1E40AF',
          accent: '#7C3AED',
          bg: '#F8FAFC',
          card: '#FFFFFF',
        }
      },
      fontSize: {
        'elderly-base': '1.25rem', // 20px
        'elderly-lg': '1.5rem',    // 24px
        'elderly-xl': '1.875rem',  // 30px
        'elderly-2xl': '2.25rem',  // 36px
        'elderly-3xl': '3rem',     // 48px
      },
      minHeight: {
        'touch': '54px', // Elderly friendly touch target
      },
      minWidth: {
        'touch': '54px',
      }
    },
  },
  plugins: [],
}
