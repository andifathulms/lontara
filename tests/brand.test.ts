import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
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
