/**
 * Enforce the JS budget from PRD §12: ≤ 200 KB gzipped.
 *
 * It became worth enforcing the moment the lexicon shipped — /baca went from
 * 121 kB to 151 kB in one commit because the reader imports entries.json, and
 * the lexicon is the part of this project most likely to grow by an order of
 * magnitude. A dictionary import would blow the budget silently and the first
 * symptom would be someone on a slow connection.
 *
 * Reads the route table from a captured `next build` log, because that is where
 * Next reports the per-route First Load JS it actually computed. Usage:
 *
 *   pnpm build | tee build.log && node scripts/check-js-budget.mjs build.log
 */
import { readFileSync } from 'node:fs'

const BUDGET_KB = 200
const log = readFileSync(process.argv[2] ?? 'build.log', 'utf8')

/** e.g. "├ ● /[locale]/baca    33 kB    151 kB" — the last size is First Load JS. */
const ROUTE = /^[┌├└│\s]*[○●ƒλ]\s+(\S+)\s+.*?([\d.]+)\s*(kB|MB|B)\s*$/gm

const routes = []
for (const match of log.matchAll(ROUTE)) {
  const [, route, size, unit] = match
  if (!route || !size || !unit) continue
  const kb = unit === 'MB' ? Number(size) * 1024 : unit === 'B' ? Number(size) / 1024 : Number(size)
  routes.push({ route, kb })
}

if (routes.length === 0) {
  console.error('tidak menemukan tabel rute di log build. Apakah `next build` benar-benar jalan?')
  process.exit(1)
}

const over = routes.filter((r) => r.kb > BUDGET_KB)
const heaviest = routes.reduce((a, b) => (b.kb > a.kb ? b : a))

console.log(`check-js-budget — anggaran ${BUDGET_KB} kB (PRD §12)`)
for (const r of [...routes].sort((a, b) => b.kb - a.kb)) {
  const share = Math.round((r.kb / BUDGET_KB) * 100)
  console.log(`  ${String(r.kb).padStart(6)} kB  ${String(share).padStart(3)}%  ${r.route}`)
}

if (over.length > 0) {
  console.error('')
  for (const r of over) {
    console.error(`  ✗ ${r.route} — ${r.kb} kB melebihi anggaran ${BUDGET_KB} kB`)
  }
  console.error('')
  console.error('  Kalau penyebabnya leksikon: muat sesuai permintaan, jangan longgarkan anggaran.')
  process.exit(1)
}

const headroom = Math.round(((BUDGET_KB - heaviest.kb) / BUDGET_KB) * 100)
console.log('')
console.log(`  terberat ${heaviest.route} pada ${heaviest.kb} kB — sisa ${headroom}%`)
if (headroom < 15) {
  console.log('  Sisa menipis. Rute terberat memuat leksikon; pertimbangkan pemuatan bertahap.')
}
