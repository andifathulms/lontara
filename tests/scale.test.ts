import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import config from '../tailwind.config'

/**
 * The type scale is closed.
 *
 * It was not. The config declared a semantic ladder and called it "one scale",
 * while the interface reached for whatever Tailwind default was nearest —
 * text-5xl, -3xl, -2xl, -xl for display, -base/-sm/-xs for prose, and two
 * arbitrary pixel values that leaked into the shipped stylesheet from a
 * *comment*, one of them a 10px step below the scale's own stated floor.
 *
 * Nothing caught that, because a scale written in a config file constrains
 * nothing on its own. This is what makes it a constraint: a size that is not a
 * declared step fails here.
 */

const DECLARED = new Set(Object.keys((config.theme?.extend?.fontSize ?? {}) as object))

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) out.push(...walk(path))
    else if (/\.tsx?$/.test(entry.name)) out.push(path)
  }
  return out
}

const FILES = [...walk('app'), ...walk('components')]

/**
 * Tailwind's own size steps. Any of these appearing in source means a size was
 * chosen off the shelf instead of from the scale — except the three the scale
 * deliberately adopts, which are pinned in the config and therefore declared.
 */
const TAILWIND_SIZES = [
  'xs', 'sm', 'base', 'lg', 'xl',
  '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl',
]

describe('every type size in the interface is a declared step', () => {
  it('finds the source tree', () => {
    expect(FILES.length).toBeGreaterThan(15)
  })

  it('uses no Tailwind size step that the scale has not adopted', () => {
    const undeclared = TAILWIND_SIZES.filter((size) => !DECLARED.has(size))
    // `placeholder:text-base` and `sm:text-sm` are the same decision wearing a
    // variant, so the match allows any prefix chain before `text-`.
    const pattern = new RegExp(`(?<![\\w-])text-(${undeclared.join('|')})(?![\\w-])`)

    const offenders: string[] = []
    for (const file of FILES) {
      for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        const hit = pattern.exec(line)
        if (hit) offenders.push(`${file}:${index + 1} uses text-${hit[1]}`)
      }
    }

    expect(
      offenders,
      `off-scale type size. Add a named step to tailwind.config.ts saying what the size is FOR, ` +
        `rather than reaching for the nearest default:\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })

  it('uses no arbitrary type size, in code or in a comment', () => {
    /*
     * Comments count. Tailwind's scanner does not know what a comment is, so a
     * class name quoted in prose becomes a real utility in the stylesheet —
     * which is exactly how a 10px step nothing used got shipped.
     */
    const offenders: string[] = []
    for (const file of FILES) {
      for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        const hit = /(?<![\w-])text-\[[^\]]+\]/.exec(line)
        if (hit) offenders.push(`${file}:${index + 1} ${hit[0]}`)
      }
    }

    expect(
      offenders,
      `arbitrary type size. Quoting one in a comment ships it too:\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })
})

describe('the scale keeps its own floor', () => {
  const sizes = (config.theme?.extend?.fontSize ?? {}) as Record<string, [string, unknown]>

  it('declares nothing smaller than anotasi', () => {
    const rem = (value: string) => {
      const match = /^([\d.]+)rem$/.exec(value)
      return match ? Number(match[1]) : null
    }

    const floor = rem(sizes.anotasi?.[0] ?? '')
    expect(floor, 'anotasi must be a plain rem value — it is the floor').toBe(0.6875)

    for (const [name, [value]] of Object.entries(sizes)) {
      const size = rem(value)
      // Fluid steps clamp upward from well above the floor; only fixed steps
      // can undercut it by accident.
      if (size === null) continue
      expect(size, `${name} is ${value}, under the ${floor}rem floor`).toBeGreaterThanOrEqual(
        floor!,
      )
    }
  })
})
