/**
 * Fetch a dated Bugis Wikipedia dump into .corpus/ (gitignored).
 *
 * A DATED dump, never `latest`. `latest` is a moving target, so a citation
 * pointing at it is not a citation — nobody could check the claim later. The
 * date and sha256 are recorded in everything derived from it.
 *
 * The dump is not vendored. It is 2.4 MB compressed and reproducible from the
 * URL plus the checksum, which is the same guarantee at none of the repo weight.
 *
 * Licence: Bugis Wikipedia text is CC BY-SA. See data/lexicon/provenance.md for
 * what that obliges and what is actually being taken.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Pinned. Bump it deliberately: a new dump changes the frequency bands and the
 * attested pair set, so it is a data change that wants reviewing, not something
 * that should drift under the project silently.
 */
export const DUMP_DATE = '20260701'
export const DUMP_SHA256 = '37b7da2c059cce33287c54edb66e87b263fdf7f732e5e67f2f1b34259ffc704e'

const WIKI = 'bugwiki'
const FILE = `${WIKI}-${DUMP_DATE}-pages-articles.xml.bz2`
export const DUMP_URL = `https://dumps.wikimedia.org/${WIKI}/${DUMP_DATE}/${FILE}`

const CACHE = join(process.cwd(), '.corpus')
const ARCHIVE = join(CACHE, FILE)
export const DUMP_XML = join(CACHE, `${WIKI}-${DUMP_DATE}-pages-articles.xml`)

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export async function ensureDump({ quiet = false } = {}) {
  const log = quiet ? () => {} : (...args) => console.log(...args)
  mkdirSync(CACHE, { recursive: true })

  if (!existsSync(ARCHIVE)) {
    log(`mengunduh ${DUMP_URL}`)
    const response = await fetch(DUMP_URL)
    if (!response.ok) throw new Error(`${response.status} ${DUMP_URL}`)
    writeFileSync(ARCHIVE, Buffer.from(await response.arrayBuffer()))
  }

  const actual = sha256(ARCHIVE)
  if (actual !== DUMP_SHA256) {
    throw new Error(
      `checksum dump tidak cocok.\n  diharapkan ${DUMP_SHA256}\n  didapat    ${actual}\n` +
        `Hapus ${ARCHIVE} lalu coba lagi, atau perbarui DUMP_SHA256 dengan sengaja.`,
    )
  }

  if (!existsSync(DUMP_XML)) {
    // Node ships zlib but not bzip2, and pulling a decompressor in for one
    // build-time script is not worth a dependency.
    log('mengekstrak…')
    execFileSync('bunzip2', ['-kf', ARCHIVE], { stdio: 'inherit' })
  }

  return {
    xml: DUMP_XML,
    url: DUMP_URL,
    date: DUMP_DATE,
    sha256: DUMP_SHA256,
    bytes: statSync(DUMP_XML).size,
  }
}

// No top-level await: tsx compiles this to CJS when a .ts script imports it,
// and CJS has no top-level await.
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureDump()
    .then((dump) => {
      console.log(`${dump.xml} — ${(dump.bytes / 1024 / 1024).toFixed(1)} MiB`)
      console.log(`  ${dump.url}`)
      console.log(`  sha256 ${dump.sha256}`)
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
