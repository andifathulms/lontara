/**
 * Regenerate public/fonts/noto-sans-buginese-subset.woff2 from the vendored
 * upstream TTF.
 *
 * The aksara face is self-hosted and subset deliberately (invariant 17): a
 * system font must never be relied on for Lontara, and the whole point of the
 * subset is that the byte budget in PRD §12 stays affordable.
 *
 * After running this you MUST re-run `pnpm render:conformance` and review the
 * image diffs by eye. A font bump is never accepted blind.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SOURCE = join(ROOT, 'vendor/fonts/NotoSansBuginese-Regular.ttf')
const OUTPUT = join(ROOT, 'public/fonts/noto-sans-buginese-subset.woff2')

/**
 * The Buginese block U+1A00–U+1A1F in full, plus:
 *   U+0020, U+00A0  spaces, so a band with pallawa-separated words measures
 *   U+25CC          DOTTED CIRCLE — the script reference renders each vowel
 *                   sign on a dotted circle to show its combining behaviour
 * Nothing outside the block. The upstream face also maps U+A9CF JAVANESE
 * PANGRANGKEP; it is deliberately dropped — Bugis only, invariant 14.
 */
const UNICODES = 'U+1A00-1A1F,U+0020,U+00A0,U+25CC'

function findSubsetter() {
  const candidates = [
    process.env.PYFTSUBSET,
    join(ROOT, 'vendor/fonts/.venv/bin/pyftsubset'),
    'pyftsubset',
  ].filter(Boolean)

  for (const c of candidates) {
    try {
      execFileSync(c, ['--help'], { stdio: 'ignore' })
      return c
    } catch {
      /* next candidate */
    }
  }
  return null
}

if (!existsSync(SOURCE)) {
  console.error(`Sumber tidak ada: ${SOURCE}`)
  process.exit(1)
}

const pyftsubset = findSubsetter()
if (!pyftsubset) {
  console.error(
    [
      'pyftsubset tidak ditemukan.',
      '',
      '  python3 -m venv vendor/fonts/.venv',
      '  vendor/fonts/.venv/bin/pip install "fonttools[woff]"',
      '',
      'Atau set PYFTSUBSET=/path/ke/pyftsubset.',
    ].join('\n'),
  )
  process.exit(1)
}

execFileSync(
  pyftsubset,
  [
    SOURCE,
    `--output-file=${OUTPUT}`,
    '--flavor=woff2',
    // Keep every layout feature. Noto Sans Buginese ships liga/abvm/dist/mark;
    // the mark-positioning features are what place the vowel signs at all.
    '--layout-features=*',
    '--no-hinting',
    '--desubroutinize',
    `--unicodes=${UNICODES}`,
  ],
  { stdio: 'inherit' },
)

const bytes = statSync(OUTPUT).size
console.log(`${OUTPUT} — ${bytes} B`)
console.log('Berikutnya: `pnpm render:conformance`, lalu periksa diff dengan mata.')
