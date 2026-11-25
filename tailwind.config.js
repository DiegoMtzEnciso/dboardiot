/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Tokens semánticos: sus valores cambian con el tema (ver src/index.css)
      colors: {
        canvas: token('base'),
        surface: token('surface'),
        surface2: token('surface2'),
        hairline: 'rgb(var(--line) / var(--hairline-a))',
        'hairline-strong': 'rgb(var(--line) / var(--hairline-strong-a))',
        food: token('food'),
        water: token('water'),
        'on-accent': token('on-accent'),
        line: token('line'),
        fg: token('fg'),
        fg2: token('fg2'),
        muted: token('muted'),
        faint: token('faint'),
        accent: token('accent'),
        ok: token('ok'),
        warn: token('warn'),
      },
    },
  },
  plugins: [],
}
