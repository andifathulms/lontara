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
const TONE = {
  daun: '#2F5A44',
  gold: '#C79A3A',
  sabbe: '#9E2B2B',
  lontar: '#DBC7A0',
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
  const colour = TONE[tone]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'inline-block', flex: 'none' }}
    >
      <path
        d="M5 0 L10 5 L5 10 L0 5 Z"
        fill={filled ? colour : 'none'}
        stroke={colour}
        strokeWidth={filled ? 0 : 1.6}
      />
    </svg>
  )
}
