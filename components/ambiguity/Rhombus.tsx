/**
 * Sulapa' eppa' — the four-cornered form. The script's endonym is *Urupu
 * Sulapa' Eppa'*, "four-cornered letters", and the rhombus is a core Bugis
 * cosmological form (PRD §10).
 *
 * The ambiguity node in the reading tree is a rhombus **because** a branch
 * point is a place where the reading has corners. This carries meaning; do not
 * substitute a generic node shape.
 *
 * `tone="daun"` is the ambiguity tone. `daun` is reserved for ambiguity and
 * nothing else, so that green always means "the script does not decide this".
 */
/*
 * Drawn in `currentColor`, so the marker is always exactly the colour of the
 * label it sits beside — the two cannot drift apart, and there is no raw hex
 * in a component. `tone` picks the text colour; every one of these is a
 * semantic token from tailwind.config.ts.
 *
 * The ambiguity rhombus is `daun-ink` rather than `daun` for the same reason
 * its label is: at 9–14px on the grid ground, #2F5A44 is a 2.28:1 smudge. It
 * is the same green, raised to where it can be seen.
 */
const TONE = {
  daun: 'text-daun-ink',
  gold: 'text-gold',
  sabbe: 'text-sabbe-ink',
  lontar: 'text-lontar',
} as const

export type RhombusTone = keyof typeof TONE

/**
 * The brand mark's small-size form: the same diamond with the vowel dot knocked
 * out of it — the dot the script so often declines to write.
 *
 * `dot` is off by default, and the ambiguity markers keep it off. A branch in
 * the reading tree is a place the reading has corners; it is not a logo, and at
 * the 9–12px those markers run at, a dot of 1px would read as a printing fault
 * rather than as meaning. The mark and the marker are the same figure playing
 * two roles, and only one of them is signing the page.
 *
 * Knocked out with `fill-rule="evenodd"` rather than by painting a circle in
 * the background colour, as `exports/svg/favicon.svg` does — that file sits on
 * its own tile and knows what is behind it. This one does not, so the hole is
 * genuinely transparent and the mark works on the grid ground, on the lontar
 * band, or on paper.
 *
 * Proportions are the kit's: the dot is 8.5% of the tile, matching
 * `r=43.5` against the 512 viewBox of the icon masters.
 */
const DIAMOND = 'M5 0 L10 5 L5 10 L0 5 Z'
const VOWEL_DOT = 'M5 4.15 A0.85 0.85 0 1 1 5 5.85 A0.85 0.85 0 1 1 5 4.15 Z'

export function Rhombus({
  size = 14,
  tone = 'daun',
  filled = true,
  dot = false,
  className,
}: {
  size?: number
  tone?: RhombusTone
  filled?: boolean
  /** Knock the vowel dot out of the centre — the brand mark, not the marker. */
  dot?: boolean
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      aria-hidden="true"
      focusable="false"
      className={`${TONE[tone]}${className ? ` ${className}` : ''}`}
      style={{ display: 'inline-block', flex: 'none' }}
    >
      <path
        d={dot ? `${DIAMOND} ${VOWEL_DOT}` : DIAMOND}
        fillRule={dot ? 'evenodd' : undefined}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.6}
      />
    </svg>
  )
}
