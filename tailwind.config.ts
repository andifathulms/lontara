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
         * 4.5:1, and no further. The structural five are unchanged and still
         * own every border, fill and ground — green still means "the script
         * does not decide this" (PRD §10), it is now legible when it says so.
         *
         * Measured against `bg-gold/10`, NOT against bare `grid`. The first
         * cut of these values cleared 4.5:1 on the bare ground and was used
         * almost nowhere on it: the reviewer-gate notice puts `sabbe-ink` on
         * `bg-gold/10` and the active trace row puts `daun-ink` there, where
         * the old values measured 3.88:1 and 3.90:1. A floor that holds only
         * on a ground the token is never used on is not a floor. `bg-gold/10`
         * is the lightest ground in the interface, so clearing it clears
         * everything — see the matrix in globals.css.
         */
        'daun-ink': '#509973', // 4.52:1 on bg-gold/10, 5.26:1 on grid
        'sabbe-ink': '#D66A6A', // 4.51:1 on bg-gold/10, 5.24:1 on grid
      },
      fontFamily: {
        aksara: ['var(--font-aksara)', 'serif'],
        latin: ['var(--font-latin)', 'Georgia', 'serif'],
        anotasi: ['var(--font-anotasi)', 'ui-monospace', 'monospace'],
      },
      /*
       * The type scale. Every size the interface may use is here, and
       * tests/scale.test.ts fails the build on any that is not.
       *
       * It reads as four ladders because the interface has four jobs:
       *
       *   prose      xs · sm · base            secondary lines, tables, notes
       *   semantic   anotasi · eyebrow · lead · section · title · display
       *   aksara     aksara-hero · -band · -row · -inline
       *   interface  field · glyph · wordmark
       *
       * That is more steps than the comment this replaces admitted to, and
       * fewer than the interface was actually using. The old note claimed one
       * scale and eleven consolidated sizes; in practice the semantic ladder
       * was declared and everything else reached for a Tailwind default —
       * text-5xl, -3xl, -2xl, -xl, -base, -sm, -xs plus two arbitrary pixel
       * values leaked in from a comment. Declared or not, they were all in
       * the stylesheet and all on the screen.
       *
       * `anotasi` is the floor: 11px, the smallest size Space Mono stays
       * readable at once letterspaced. Nothing may be smaller.
       */
      fontSize: {
        /*
         * Tailwind's own three prose steps, pinned here at exactly their
         * default values.
         *
         * They are not redefined — they are written down. The comment below
         * claimed this project had one type scale; it had two, this one and
         * the semantic ladder, and only the second was declared. `text-sm`
         * carries 54 of the interface's secondary lines and `text-xs` another
         * 38, so calling them "not part of the scale" described nothing that
         * was true. Pinning them makes the scale complete in one file and
         * makes a future change to secondary text one edit rather than 54.
         *
         * `xs` is deliberately the same size as `eyebrow`: an eyebrow IS this
         * size, plus uppercase and letterspacing. That is one size with two
         * treatments, not two sizes.
         */
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],

        anotasi: ['0.6875rem', { lineHeight: '1.5' }],
        eyebrow: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        lead: ['clamp(1.0625rem, 1.0125rem + 0.25vw, 1.1875rem)', { lineHeight: '1.6' }],
        section: ['clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)', { lineHeight: '1.25' }],
        title: ['clamp(1.625rem, 1.4rem + 1.1vw, 2.125rem)', { lineHeight: '1.15' }],
        display: ['clamp(2rem, 1.6rem + 2vw, 3rem)', { lineHeight: '1.1' }],
        /*
         * The aksara scale.
         *
         * The script is the one thing every user is here to look at, and it was
         * set at five different sizes through five different Tailwind defaults
         * — text-5xl, -3xl, -2xl, -xl and one real step — with nothing saying
         * which size meant what. The sizes were not wrong; they were ungoverned,
         * so "how big is aksara in a table row" had six answers and no owner.
         *
         * Named by role, not by magnitude, so the question a component asks is
         * "what is this glyph for" and not "how big should this be". Sizes are
         * unchanged from what those defaults rendered, except where the old
         * value was a bug — see AttestedForms.
         *
         * Line heights are baked in at what the defaults produced, so no
         * component needs a `leading-*` beside the size. `.aksara` in
         * globals.css sets 1.9 for running aksara inside prose; every step here
         * is a display context and overrides it deliberately.
         */
        /** The specimen. The landing hero — the first characters anyone sees. */
        'aksara-hero': ['clamp(3.25rem, 2.5rem + 3.5vw, 4.5rem)', { lineHeight: '1' }],
        /** The writer's output band, and the conformance page's test strings. */
        'aksara-band': ['3rem', { lineHeight: '1' }],
        /** A row in a table or a list: the inventory, the collision sets. */
        'aksara-row': ['1.875rem', { lineHeight: '1.2' }],
        /** Dense inline glyph inside running text or a tight table cell. */
        'aksara-inline': ['1.25rem', { lineHeight: '1.4' }],

        /*
         * Three interface roles that are not prose and not aksara-specific.
         * Each was a bare Tailwind default used once or twice with nothing
         * saying what it was for.
         */
        /** The tool input. One size whichever script is being typed into it. */
        field: ['1.875rem', { lineHeight: '1.2' }],
        /**
         * A large single glyph or short string inside a control or panel:
         * keyboard keys, the backspace mark that has to sit level with them,
         * example chips, the reader's skeleton line. Script-neutral on
         * purpose — the backspace ⌫ is not aksara but must match the key row.
         */
        glyph: ['1.5rem', { lineHeight: '1.333' }],
        /** The wordmark beside the mark. Fixed: brand does not scale with the page. */
        wordmark: ['1.25rem', { lineHeight: '1.2' }],
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
