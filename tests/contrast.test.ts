import { describe, expect, it } from 'vitest'
import config from '../tailwind.config'

/**
 * The 4.5:1 floor, enforced rather than described.
 *
 * This exists because the floor was documented and wrong at the same time.
 * globals.css carried a table of ratios measured against the bare `grid`
 * ground — which is the one ground the two ink colours are hardly ever used
 * on. Measured where they are actually used (`bg-gold/10` under the reviewer
 * gate notice, `bg-lontar/5` under the ambiguity labels) both were below the
 * floor, at 3.88:1 and 3.90:1, while the table on the page said they passed.
 *
 * A comment cannot catch that. This can, so the comment is now a rendering of
 * something checked.
 *
 * `daun` and `sabbe` themselves are deliberately absent from the ink list:
 * PRD §10 fixes them and they never set type. They own borders, fills and
 * markers, where the 4.5:1 text floor does not apply.
 */

type RGB = readonly [number, number, number]

function hex(value: string): RGB {
  const h = value.replace('#', '')
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ]
}

/** WCAG 2.1 relative luminance. */
function luminance([r, g, b]: RGB): number {
  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

/** Tailwind's `bg-x/NN` and `text-x/NN` are alpha over whatever is behind. */
function over(fg: RGB, alpha: number, bg: RGB): RGB {
  return [
    alpha * fg[0] + (1 - alpha) * bg[0],
    alpha * fg[1] + (1 - alpha) * bg[1],
    alpha * fg[2] + (1 - alpha) * bg[2],
  ]
}

/* Read from the config rather than restated, so changing a token here fails
   here — the point of the test is that the two cannot drift apart. */
const colors = (config.theme?.extend?.colors ?? {}) as Record<string, string>
const GRID = hex(colors.grid!)
const LONTAR = hex(colors.lontar!)
const GOLD = hex(colors.gold!)
const SABBE = hex(colors.sabbe!)

/**
 * Every ground text is set on anywhere in the interface. A new tinted panel
 * belongs in this list; if it is lighter than `bg-gold/10` it will fail, which
 * is the intended answer — take a border instead of a paler fill.
 */
const GROUNDS: readonly (readonly [string, RGB])[] = [
  ['grid', GRID],
  ['bg-lontar/5', over(LONTAR, 0.05, GRID)],
  ['bg-sabbe/10', over(SABBE, 0.1, GRID)],
  ['bg-gold/5', over(GOLD, 0.05, GRID)],
  ['bg-gold/10', over(GOLD, 0.1, GRID)],
]

/** Every colour that sets type, at every opacity the codebase uses it at. */
const INKS: readonly (readonly [string, (ground: RGB) => RGB])[] = [
  ['text-lontar', (g) => over(LONTAR, 1, g)],
  ['text-lontar/85', (g) => over(LONTAR, 0.85, g)],
  ['text-lontar/75', (g) => over(LONTAR, 0.75, g)],
  ['text-lontar/65', (g) => over(LONTAR, 0.65, g)],
  ['text-gold', () => GOLD],
  ['text-daun-ink', () => hex(colors['daun-ink']!)],
  ['text-sabbe-ink', () => hex(colors['sabbe-ink']!)],
]

const FLOOR = 4.5

describe('the 4.5:1 text floor holds on every ground, not just the bare one', () => {
  for (const [groundName, ground] of GROUNDS) {
    for (const [inkName, ink] of INKS) {
      it(`${inkName} on ${groundName}`, () => {
        const measured = ratio(ink(ground), ground)
        expect(
          measured,
          `${inkName} on ${groundName} is ${measured.toFixed(2)}:1, under the ${FLOOR}:1 floor`,
        ).toBeGreaterThanOrEqual(FLOOR)
      })
    }
  }
})

describe('the ink tier stays the same colour it was derived from', () => {
  /*
   * The inks are raised for legibility, not rebranded: green still has to
   * mean "the script does not decide this" (PRD §10). Hue is what carries
   * that, so hue is what is pinned — lightness is free to move if a future
   * ground demands it.
   */
  function hue([r, g, b]: RGB): number {
    const [max, min] = [Math.max(r, g, b), Math.min(r, g, b)]
    if (max === min) return 0
    const d = max - min
    const h =
      max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    return ((h * 60) % 360 + 360) % 360
  }

  it('daun-ink keeps daun’s hue', () => {
    expect(Math.abs(hue(hex(colors['daun-ink']!)) - hue(hex(colors.daun!)))).toBeLessThan(3)
  })

  it('sabbe-ink keeps sabbe’s hue', () => {
    expect(Math.abs(hue(hex(colors['sabbe-ink']!)) - hue(hex(colors.sabbe!)))).toBeLessThan(3)
  })

  it('the structural five are untouched by PRD §10', () => {
    expect(colors.grid).toBe('#1A1614')
    expect(colors.sabbe).toBe('#9E2B2B')
    expect(colors.gold).toBe('#C79A3A')
    expect(colors.daun).toBe('#2F5A44')
    expect(colors.lontar).toBe('#DBC7A0')
  })
})
