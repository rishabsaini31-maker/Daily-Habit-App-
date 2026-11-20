/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#08090D',
          bg: '#08090D',
          card: '#12141D',
          surface: '#161925',
          border: '#1E2230',
        },
        cyan: {
          accent: '#38BDF8',
          glow: 'rgba(56, 189, 248, 0.15)',
        },
        emerald: {
          accent: '#10B981',
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        muted: {
          DEFAULT: '#8A94A6',
          dark: '#586274',
        },
        slate: {
          850: '#151f32',
          900: '#12141D',
          950: '#08090D',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
};
