import type { Config } from 'tailwindcss'

/**
 * Palette: lipa' sabbe — the Bugis silk sarong. Five values, hard grid lines,
 * no gradients. PRD §10.
 *
 * `daun` is reserved exclusively for ambiguity markers, so that green always
 * means "the script does not decide this". Never use it for anything else.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        grid: '#1A1614',
        sabbe: '#9E2B2B',
        gold: '#C79A3A',
        daun: '#2F5A44',
        lontar: '#DBC7A0',
      },
      fontFamily: {
        aksara: ['var(--font-aksara)', 'serif'],
        latin: ['var(--font-latin)', 'Georgia', 'serif'],
        anotasi: ['var(--font-anotasi)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
}

export default config
