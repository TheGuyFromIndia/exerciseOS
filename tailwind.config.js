/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        exercise: {
          blue: '#2563eb',
          'blue-dark': '#1d4ed8',
          teal: '#0d9488',
          'teal-dark': '#0f766e',
          purple: '#7c3aed',
          'purple-dark': '#6d28d9',
          grey: '#374151',
          'grey-dark': '#1f2937',
          green: '#16a34a',
          amber: '#d97706',
          rest: '#1f2937',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
