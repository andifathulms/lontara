import { codepointsOf, interpret } from '@/lib/engine/interpret'
import type { Lexicon } from '@/lib/lexicon/types'
import { RULE_SET } from '@/lib/rules/loader'
import { AMBIGUITY_CLASSES, type AmbiguityClass } from '@/lib/rules/schema'

/**
 * How far this lexicon collapses when it is written.
 *
 * PRD §2 illustrates defectiveness with `mata · matta · manta`, and that
 * illustration is *asserted* — it is three words chosen to make the point. This
 * measures the same property against the vocabulary the repository actually
 * holds: run the shipped writer over every entry, group by the Lontara string
 * it produces, and report every group with more than one form in it.
 *
 * # What this measures, and what it does not
 *
 * It measures **this lexicon under this rule set**. It is not a statement about
 * Bugis. The lexicon is 1,323 forms scraped from Bugis Wikipedia, every one
 * `attestation: "corpus"` — the corpus also contains Indonesian, English and
 * foreign place names, and nothing in this repository can tell them apart (see
 * `attestation.corpusWarning`). It shows in the output: the largest collision
 * set here is eight English words. The mechanism on display is real and
 * correctly computed; the vocabulary it is computed over is not trustworthy,
 * and the page that renders this has to say so before it shows a number.
 *
 * # Two things that would otherwise produce a wrong number
 *
 * 1. **Forms are grouped on their NORMALIZED Latin.** `aba'` and `abaq` are one
 *    form under `latin.glottal.q`, not two words that happen to collide.
 *    Counting the raw spellings would have inflated both the collision count
 *    and the set sizes with the same word written twice.
 * 2. **Forms the writer cannot write are excluded and reported.** An entry that
 *    produces an `unhandled` step has no Lontara string to collide on, and
 *    letting such forms fall into a shared empty-string bucket would invent the
 *    largest collision set on the page.
 *
 * Pure, and takes the lexicon as an argument rather than importing the shipped
 * one (invariant 5). Every number here is a count of engine output — nothing is
 * estimated, weighted or sampled.
 *
 * NOTE: intended for build-time use by a server component. It runs one
 * `interpret` per entry plus one per form; do not import it into a client
 * component.
 */

export type CollisionMember = {
  /** The normalized Latin form — what the rule set considers one word. */
  readonly latin: string
  /** Raw spellings in the lexicon that normalize to it. Usually one. */
  readonly spellings: readonly string[]
  readonly entryIds: readonly string[]
  /** Which unwritten things this form loses on the way in. */
  readonly classes: readonly AmbiguityClass[]
}

export type CollisionSet = {
  readonly lontara: string
  readonly codepoints: readonly string[]
  /** Always two or more, sorted for determinism. */
  readonly members: readonly CollisionMember[]
  /** The union over members — which classes are doing the collapsing here. */
  readonly classes: readonly AmbiguityClass[]
}

export type CollisionReport = {
  readonly lexiconVersion: string
  readonly ruleSetVersion: string
  readonly reviewStatus: 'unreviewed' | 'reviewed'
  /** Raw lexicon entries considered. */
  readonly entries: number
  /** Distinct forms after normalization — the real denominator. */
  readonly forms: number
  /** Entries that merged into another form's spelling. `entries - forms`. */
  readonly mergedSpellings: number
  /** Forms the writer could not write, named rather than counted away. */
  readonly unwritable: readonly string[]
  /** Distinct Lontara strings the writable forms produce. */
  readonly strings: number
  /** Every group of two or more forms sharing a string. Largest first. */
  readonly sets: readonly CollisionSet[]
  readonly formsInCollision: number
  readonly largest: number
  /** How many sets each class takes part in. A set can count under several. */
  readonly setsByClass: Readonly<Record<AmbiguityClass, number>>
}

const ORDER: Readonly<Record<AmbiguityClass, number>> = {
  final: 0,
  gemination: 1,
  prenasal: 2,
  glottal: 3,
}

function sortClasses(classes: Iterable<AmbiguityClass>): AmbiguityClass[] {
  return [...new Set(classes)].sort((a, b) => ORDER[a] - ORDER[b])
}

export function collisionReport(lexicon: Lexicon): CollisionReport {
  /*
   * Pass one: collapse raw entries onto their normalized Latin form. The
   * lexicon holds `aba'` and `abaq` as separate entries with separate ids, and
   * they are the same word — grouping on the raw string would report a
   * collision between a word and itself.
   */
  const byForm = new Map<string, { spellings: string[]; entryIds: string[] }>()
  for (const entry of lexicon.entries) {
    const normalized = interpret(entry.latin).input.normalized
    const found = byForm.get(normalized) ?? { spellings: [], entryIds: [] }
    if (!found.spellings.includes(entry.latin)) found.spellings.push(entry.latin)
    found.entryIds.push(entry.id)
    byForm.set(normalized, found)
  }

  /*
   * Pass two: write each form and group by what it produced. A form the writer
   * cannot fully write is set aside by name — it has no string to collide on,
   * and bucketing them together under `''` would manufacture a collision set
   * out of the engine's own gaps.
   */
  const byLontara = new Map<string, CollisionMember[]>()
  const unwritable: string[] = []

  for (const [latin, { spellings, entryIds }] of byForm) {
    const trace = interpret(latin)
    const unhandled = trace.steps.some((step) => step.type === 'unhandled')

    if (unhandled || trace.output.text === '') {
      unwritable.push(latin)
      continue
    }

    const member: CollisionMember = {
      latin,
      spellings: [...spellings].sort((a, b) => a.localeCompare(b)),
      entryIds: [...entryIds].sort((a, b) => a.localeCompare(b)),
      classes: sortClasses(trace.ambiguities.map((a) => a.class)),
    }

    const list = byLontara.get(trace.output.text) ?? []
    list.push(member)
    byLontara.set(trace.output.text, list)
  }

  const sets: CollisionSet[] = [...byLontara.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([lontara, members]) => ({
      lontara,
      codepoints: codepointsOf(lontara),
      members: [...members].sort((a, b) => a.latin.localeCompare(b.latin)),
      classes: sortClasses(members.flatMap((m) => m.classes)),
    }))
    // Largest first, then alphabetically — a stable order, so the page does not
    // reshuffle between builds for no reason.
    .sort((a, b) => b.members.length - a.members.length || a.lontara.localeCompare(b.lontara))

  const setsByClass = Object.fromEntries(
    AMBIGUITY_CLASSES.map((cls) => [cls, sets.filter((s) => s.classes.includes(cls)).length]),
  ) as Record<AmbiguityClass, number>

  return {
    lexiconVersion: lexicon.version,
    ruleSetVersion: RULE_SET.version,
    reviewStatus: RULE_SET.reviewStatus,
    entries: lexicon.entries.length,
    forms: byForm.size,
    mergedSpellings: lexicon.entries.length - byForm.size,
    unwritable: unwritable.sort((a, b) => a.localeCompare(b)),
    strings: byLontara.size,
    sets,
    formsInCollision: sets.reduce((n, s) => n + s.members.length, 0),
    largest: sets[0]?.members.length ?? 0,
    setsByClass,
  }
}
