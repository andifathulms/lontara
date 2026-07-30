/**
 * Per-entry provenance and schema. Wired into `build` and CI and it may fail the
 * deploy. Do not weaken it.
 *
 * Invariant 13: every lexicon entry has a provenance field; no entry without a
 * source; anything with unclear licensing does not go in, however convenient.
 * "Convenient" is the operative word — this check exists for the moment when a
 * few thousand entries are sitting in a PDF and the licence has not been read
 * yet.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LexiconSchema } from '../lib/lexicon/loader'
import { interpret } from '../lib/engine/interpret'

const problems: string[] = []
const notes: string[] = []

const raw = JSON.parse(readFileSync(join(process.cwd(), 'data/lexicon/entries.json'), 'utf8'))
const result = LexiconSchema.safeParse(raw)

if (!result.success) {
  for (const issue of result.error.issues) {
    problems.push(`entries.json ${issue.path.join('.')}: ${issue.message}`)
  }
  console.error(`lexicon:validate — ${problems.length} masalah\n`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}

const lexicon = result.data

/**
 * Phrases that mean "we have not established the licence". An entry may not
 * ship with one of these in its licence field — that is the whole point of
 * invariant 13, and the failure mode is someone typing "unknown" to get past
 * the check.
 */
const NOT_A_LICENCE = [
  'unknown',
  'unclear',
  'tbd',
  'todo',
  'n/a',
  'na',
  'none',
  '?',
  'public domain?',
  'probably',
  'assumed',
]

const seenIds = new Set<string>()

for (const entry of lexicon.entries) {
  if (seenIds.has(entry.id)) problems.push(`duplicate entry id: ${entry.id}`)
  seenIds.add(entry.id)

  const licence = entry.provenance.licence.trim().toLowerCase()
  if (NOT_A_LICENCE.includes(licence)) {
    problems.push(
      `${entry.id}: licence is "${entry.provenance.licence}", which is not a licence. ` +
        `Anything with unclear licensing does not go in (invariant 13), however convenient.`,
    )
  }

  if (entry.provenance.source.trim().length < 4) {
    problems.push(`${entry.id}: provenance.source is too short to identify a source`)
  }

  // A Latin headword must be writable by the rule set. An entry the writer
  // cannot process could never be reached by the reader's enumeration, so it
  // would sit in the lexicon looking like coverage while contributing nothing.
  const trace = interpret(entry.latin)
  const unhandled = trace.steps.filter((s) => s.type === 'unhandled')
  if (unhandled.length > 0) {
    problems.push(
      `${entry.id} ("${entry.latin}"): the rule set cannot write ` +
        `${unhandled.map((s) => (s.type === 'unhandled' ? `"${s.text}"` : '')).join(', ')}. ` +
        `Either the orthography is wrong or the entry is mis-transcribed.`,
    )
  }
  if (trace.output.text.length === 0) {
    problems.push(`${entry.id} ("${entry.latin}"): writes to nothing at all`)
  }
}

// Band distribution, so a lexicon full of guessed bands is visible rather than
// buried. A band is a claim about frequency.
const byBand = new Map<string, number>()
for (const e of lexicon.entries) byBand.set(e.band, (byBand.get(e.band) ?? 0) + 1)

const sources = new Set(lexicon.entries.map((e) => e.provenance.source))

if (problems.length > 0) {
  console.error(`lexicon:validate — ${problems.length} masalah\n`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error('')
  process.exit(1)
}

if (lexicon.entries.length === 0) {
  notes.push('0 lema. Kosong dengan sengaja — lihat data/lexicon/provenance.md.')
  notes.push(
    'The reader is lexicon-driven, so with no entries it can state the syllable skeleton and ' +
      'that the four classes are undetermined — and it says exactly that.',
  )
} else {
  notes.push(`${lexicon.entries.length} lema dari ${sources.size} sumber.`)
  for (const [band, count] of [...byBand].sort((a, b) => b[1] - a[1])) {
    notes.push(`  band ${band}: ${count}`)
  }
  const unknownShare = (byBand.get('unknown') ?? 0) / lexicon.entries.length
  if (unknownShare > 0.9) {
    notes.push(
      'Nearly every band is "unknown", so ranking is close to arbitrary. That is honest, but ' +
        'the Bugis Wikipedia corpus is the cheapest way to fix it — its licence is already clear.',
    )
  }
}

console.log(`lexicon:validate — lolos (v${lexicon.version})`)
for (const n of notes) console.log(`  · ${n}`)
