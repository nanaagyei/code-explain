/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        page: '#fafaf9',
      },
        // Modern Minimalist Palette (OpenAI/Claude style)
        // Base: White + Charcoal for high contrast
        charcoal: {
          DEFAULT: '#080808',
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1A1A1A',
          950: '#080808',
        },
        // Accent: Electric Blue for interactive elements
        electric: {
          50: '#E5F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B2FF',
          400: '#3399FF',
          500: '#0066FF', // Primary electric blue
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
        },
        // Primary colors (alias for electric/blue)
        primary: {
          50: '#E5F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B2FF',
          400: '#3399FF',
          500: '#0066FF',
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
        },
        // Accent (YC-style: slate, no purple)
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Keep some utility colors
        success: {
          50: '#D1FAE5',
          100: '#A7F3D0',
          200: '#6EE7B7',
          300: '#34D399',
          400: '#10B981',
          500: '#059669',
          600: '#047857',
          700: '#065F46',
          800: '#064E3B',
          900: '#022C22',
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#065F46',
        },
        danger: {
          50: '#FEE2E2',
          100: '#FECACA',
          200: '#FCA5A5',
          300: '#F87171',
          400: '#EF4444',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#7F1D1D',
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#991B1B',
        },
        warning: {
          50: '#FEF3C7',
          100: '#FDE68A',
          200: '#FCD34D',
          300: '#FBBF24',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#92400E',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'float-slower': 'float-slower 12s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)' },
          '50%': { transform: 'translateY(-30px) translateX(-20px) scale(1.05)' },
        },
        'float-slower': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)' },
          '33%': { transform: 'translateY(20px) translateX(20px) scale(1.08)' },
          '66%': { transform: 'translateY(-10px) translateX(-10px) scale(0.95)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.05' },
          '50%': { opacity: '0.1' },
        },
        'slide-up': {
          'from': {
            transform: 'translateY(100%)',
            opacity: '0'
          },
          'to': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'stagger-in': {
          'from': {
            transform: 'translateY(12px)',
            opacity: '0'
          },
          'to': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 102, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 102, 255, 0.4)',
      },
    },
  },
  plugins: [],
}
