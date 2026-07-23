/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#050505",
          dark: "#0C0C0E",
          card: "#121215",
          elevated: "#18181C",
          border: "#26262B",
          muted: "#8E8E93",
          light: "#E5E5EA",
          white: "#FFFFFF",
          accent: "#00E5FF", // Electric Cyan CTA / Compatibility ring highlight
          accentHover: "#33EBFF",
          volt: "#CCFF00", // High impact sport volt badge
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glow-accent': '0 0 25px -5px rgba(0, 229, 255, 0.25)',
        'glow-white': '0 0 30px -5px rgba(255, 255, 255, 0.15)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.8)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
