/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arimo', 'system-ui', '-apple-system', 'sans-serif'],
        arimo: ['Arimo', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
        },
        // High contrast accent palette
        accent: {
          purple: '#7c3aed',
          magenta: '#a21caf',
          pink: '#db2777',
          indigo: '#4f46e5',
          blue: '#2563eb',
        },
        surface: {
          light: '#f5f3ff',
          dark: '#0f0d1a',
          glass: 'rgba(255,255,255,0.92)',
          'glass-dark': 'rgba(15,13,26,0.96)',
        },
        text: {
          primary: '#0f0d1a',
          secondary: '#374151',
          muted: '#6b7280',
          inverse: '#ffffff',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      boxShadow: {
        'glow': '0 0 40px rgba(79, 70, 229, 0.3)',
        'glow-lg': '0 0 60px rgba(79, 70, 229, 0.4)',
        'card': '0 2px 16px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 16px 48px rgba(79, 70, 229, 0.18)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
