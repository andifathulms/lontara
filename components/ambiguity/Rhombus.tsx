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

export function Rhombus({
  size = 14,
  tone = 'daun',
  filled = true,
  className,
}: {
  size?: number
  tone?: RhombusTone
  filled?: boolean
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
        d="M5 0 L10 5 L5 10 L0 5 Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.6}
      />
    </svg>
  )
}
