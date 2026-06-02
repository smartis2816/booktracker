/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: 'var(--green)',
          dark:    'var(--green-dark)',
          darker:  'var(--green-darker)',
        },
        bg:        'var(--bg)',
        card:      'var(--card)',
        muted:     'var(--muted)',
        border:    'var(--border)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      backgroundColor: {
        'quote': 'var(--quote-bg)',
        'chip':  'var(--chip-soft)',
      },
    },
  },
  plugins: [],
}
