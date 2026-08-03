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

        /*
         * Text tier. Measured, not chosen: as *type* on the grid ground,
         * `daun` is 2.28:1 and `sabbe` is 2.42:1 — both below the 3:1 floor
         * for large text, let alone the 4.5:1 for body. `daun` carries every
         * ambiguity label, which is the one thing in this app that must be
         * readable, so it cannot stay at 2.28:1.
         *
         * These are not a sixth and seventh palette value. Same hue, same
         * saturation; lightness raised only as far as it takes to clear
         * 4.5:1 on `grid`, and no further. The structural five are unchanged
         * and still own every border, fill and ground — green still means
         * "the script does not decide this" (PRD §10), it is now legible
         * when it says so.
         */
        'daun-ink': '#498D6A', // 4.53:1 on grid
        'sabbe-ink': '#D25858', // 4.51:1 on grid
      },
      fontFamily: {
        aksara: ['var(--font-aksara)', 'serif'],
        latin: ['var(--font-latin)', 'Georgia', 'serif'],
        anotasi: ['var(--font-anotasi)', 'ui-monospace', 'monospace'],
      },
      /*
       * One scale, fluid where it earns it. Before this there were eleven
       * hand-picked sizes across the app and two of them (10px with
       * `tracking-widest`) sat under the legible floor.
       *
       * `anotasi` is that floor: 11px, the smallest size Space Mono stays
       * readable at once letterspaced. Nothing may be smaller.
       */
      fontSize: {
        anotasi: ['0.6875rem', { lineHeight: '1.5' }],
        eyebrow: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        lead: ['clamp(1.0625rem, 1.0125rem + 0.25vw, 1.1875rem)', { lineHeight: '1.6' }],
        section: ['clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)', { lineHeight: '1.25' }],
        title: ['clamp(1.625rem, 1.4rem + 1.1vw, 2.125rem)', { lineHeight: '1.15' }],
        display: ['clamp(2rem, 1.6rem + 2vw, 3rem)', { lineHeight: '1.1' }],
      },
      /*
       * A line of Gentium at this size runs to ~95 characters inside
       * `max-w-3xl`, which is well past comfortable. `measure` caps prose at
       * a readable line length instead of at a container width.
       */
      maxWidth: {
        measure: '66ch',
        'measure-tight': '52ch',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
}

export default config
