import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

/**
 * The brand assets fail quietly when they fail. A renamed icon does not break a
 * build, throw, or show up in a diff review — the tab just goes blank, the
 * install prompt loses its icon, and a shared link previews as nothing. Nobody
 * notices until someone screenshots it.
 *
 * These assertions are cheap and they are the only thing standing between a
 * rename and a silent regression.
 */
const PUBLIC = join(process.cwd(), 'public')
const MANIFEST = join(PUBLIC, 'manifest.webmanifest')

/**
 * Read and parse, rather than `import` — `.webmanifest` is not a module
 * extension anything here resolves, and an import silently yields an empty
 * object, which is how the first version of this file passed nothing while
 * appearing to assert five things. It is also what a browser does.
 */
type Manifest = {
  start_url: string
  scope: string
  background_color: string
  theme_color: string
  icons: { src: string; sizes: string; type: string; purpose: string }[]
}
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest

describe('brand assets are present', () => {
  const REFERENCED = [
    'favicon.svg',
    'icon/lontara-icon-32.png',
    'icon/lontara-icon-180.png',
    'icon/lontara-icon-192.png',
    'icon/lontara-icon-512.png',
    'icon/lontara-icon-maskable-512.png',
    'social/lontara-og-1200x630.png',
  ]

  for (const rel of REFERENCED) {
    it(`public/${rel} exists`, () => {
      expect(existsSync(join(PUBLIC, rel)), `${rel} is referenced but not vendored`).toBe(true)
    })
  }

  it('vendors only what is served — the export is precached whole', () => {
    // exports/ is gitignored and holds sixteen sizes plus lockups and
    // wordmarks. Anything that lands in public/ is downloaded by every visitor
    // and kept for offline, so the shipped set stays deliberately small.
    const total = REFERENCED.reduce(
      (sum, rel) => sum + readFileSync(join(PUBLIC, rel)).length,
      0,
    )
    expect(total, 'the vendored brand set has grown past 128 KB').toBeLessThan(128 * 1024)
  })
})

describe('the web app manifest', () => {
  it('keeps every URL relative, so one file works at / and at /lontara/', () => {
    // Absolute paths here would resolve to the domain root, which on a project
    // page belongs to someone else. This is the same reason public/index.html
    // uses relative hrefs.
    const urls = [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)]
    for (const url of urls) {
      expect(url, `${url} must be relative`).not.toMatch(/^(\/|https?:)/)
    }
  })

  it('points at icons that exist, resolved the way a browser would', () => {
    for (const icon of manifest.icons) {
      const resolved = join(dirname(MANIFEST), icon.src)
      expect(existsSync(resolved), `${icon.src} is in the manifest but not on disk`).toBe(true)
    }
  })

  it('declares a maskable icon, because Android crops to its own shape', () => {
    // Without one, Android applies its mask to a square icon and takes the
    // corners of the mark off.
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true)
  })

  it('launches into a locale, not the redirect stub', () => {
    // The bare root is a meta-refresh; an installed app opening there shows a
    // blank frame before it moves.
    expect(manifest.start_url).toMatch(/^(id|en)\/$/)
  })

  it('uses the app ground, not the icon tile, for the splash', () => {
    // #15120C is the kit's tile; #1A1614 is `grid`, what the app actually is.
    // See public/icon/BRAND.md.
    expect(manifest.background_color).toBe('#1A1614')
    expect(manifest.theme_color).toBe('#1A1614')
  })
})

/*
 * The mark and the marker are the same figure doing two jobs.
 *
 * `Rhombus` with the vowel dot knocked out is the brand mark — it signs the
 * page. `Rhombus` without it is an ambiguity marker: a branch point is a place
 * the reading has corners (PRD §10), which is a statement about the script and
 * not a logo. If the dot spreads to the markers, the header stops being a
 * signature and the markers start looking like branding, and at the 9–12px
 * they run at the dot is a sub-pixel smudge anyway.
 *
 * One call site may pass `dot`. This is what says so.
 */
describe('the brand mark is used as a mark, not as decoration', () => {
  function walk(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) out.push(...walk(path))
      else if (/\.tsx$/.test(entry.name)) out.push(path)
    }
    return out
  }

  const callSites = [...walk('components'), ...walk('app')].flatMap((file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    return [...source.matchAll(/<Rhombus[^/>]*\/>/g)].map((m) => ({ file, tag: m[0] }))
  })

  it('finds the call sites', () => {
    expect(callSites.length).toBeGreaterThan(5)
  })

  it('exactly one place draws the dot, and it is the site header', () => {
    const withDot = callSites.filter((c) => /\bdot\b/.test(c.tag))
    expect(withDot.map((c) => c.file)).toEqual(['components/chrome/SiteHeader.tsx'])
  })

  it('the mark is large enough for the dot to survive', () => {
    // The dot is 8.5% of the mark. Below ~16px it is under 3 device pixels and
    // fills in, which is why the kit ships a separate solid form for 16 and 32.
    const header = callSites.find((c) => /\bdot\b/.test(c.tag))
    const size = Number(/size=\{(\d+)\}/.exec(header?.tag ?? '')?.[1])
    expect(size).toBeGreaterThanOrEqual(16)
  })

  it('every ambiguity marker stays plain', () => {
    for (const site of callSites.filter((c) => /tone="daun"/.test(c.tag))) {
      expect(site.tag, `${site.file} puts the brand dot on an ambiguity marker`).not.toMatch(
        /\bdot\b/,
      )
    }
  })
})
