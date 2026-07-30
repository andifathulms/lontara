/**
 * Serve ./out under the production basePath, so what you check locally is what
 * GitHub Pages will serve. PRD §13 — verify under the production basePath
 * before pushing.
 */
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'

const BASE_PATH = '/lontara'
const ROOT = join(process.cwd(), 'out')
const PORT = Number(process.env.PORT ?? 4321)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

try {
  statSync(ROOT)
} catch {
  console.error('out/ tidak ada. Jalankan `pnpm build` dulu.')
  process.exit(1)
}

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0])
  if (p === BASE_PATH) p = `${BASE_PATH}/`
  if (!p.startsWith(`${BASE_PATH}/`)) return null
  p = p.slice(BASE_PATH.length)

  // Reject traversal before touching the filesystem.
  const rel = normalize(p).replace(/^(\.\.(\/|\\|$))+/, '')
  if (rel.split(sep).includes('..')) return null

  const candidates = rel.endsWith('/')
    ? [join(ROOT, rel, 'index.html')]
    : [join(ROOT, rel), join(ROOT, `${rel}.html`), join(ROOT, rel, 'index.html')]

  for (const c of candidates) {
    if (!c.startsWith(ROOT)) continue
    try {
      if (statSync(c).isFile()) return c
    } catch {
      /* next candidate */
    }
  }
  return null
}

createServer((req, res) => {
  if (req.url === '/' || req.url === '') {
    res.writeHead(302, { Location: `${BASE_PATH}/` })
    res.end()
    return
  }

  const file = resolve(req.url)
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`404 — di luar basePath ${BASE_PATH} atau berkas tidak ada\n`)
    return
  }

  res.writeHead(200, {
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  })
  createReadStream(file).pipe(res)
}).listen(PORT, () => {
  console.log(`out/ tersaji di http://localhost:${PORT}${BASE_PATH}/`)
})
