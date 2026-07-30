import { INVENTORY } from '@/lib/rules/inventory'
import { RULE_SET, rule } from '@/lib/rules/loader'
import type { AmbiguityClass } from '@/lib/rules/schema'
import type { Lexicon, LexiconEntry, FrequencyBand } from '@/lib/lexicon/loader'
import { interpret } from './interpret'
import { normalize, toClusters } from './normalize'
import { classifyFinal, segmentLatin, segmentLontara, type LatinUnit, type LontaraUnit } from './segment'
import {
  span,
  type Ambiguity,
  type Span,
  type TraceStep,
  type TransliterationTrace,
} from './trace'
import { bandOf, scoreReading, UNATTESTED_SCORE, type Score } from './rank'

/**
 * The reader. Lontara → Latin: the **expanding** traversal (invariant 8).
 *
 * # Why this is lexicon-driven
 *
 * The obvious design is structural: at each syllable, branch over every
 * consonant that could close it. That needs an inventory of possible final
 * consonants, and this repository cannot cite one — see
 * `openQuestions.final-inventory`. Seeding it with a guess would produce a
 * confident-looking tree of readings that are not Bugis, which is the specific
 * failure this project exists to avoid.
 *
 * So enumeration inverts the writer over the lexicon: a reading is a lexicon
 * entry which, run through `interpret`, produces exactly this Lontara string.
 * That needs no orthographic rule about finals at all — it composes cited rules
 * with an attested word list, and every reading carries the writer trace that
 * proves it.
 *
 * The cost is stated rather than hidden. Enumeration is complete **relative to
 * the lexicon**, not absolutely: the four classes remain undetermined by the
 * script, and with an empty lexicon the reader can offer the syllable skeleton
 * and nothing else. `undetermined` and `basisNote` say so on every result.
 */

export type EnumerateOptions = {
  /** Reported when it bites, never applied silently (PRD §6.1). */
  readonly maxReadings?: number
  readonly maxDepth?: number
}

const DEFAULT_MAX_READINGS = 200
const DEFAULT_MAX_DEPTH = 40

export type Reading = {
  readonly latin: string
  readonly attested: boolean
  readonly entries: readonly LexiconEntry[]
  readonly band: FrequencyBand | null
  readonly score: Score
  /** Which unwritten things this reading recovers. Empty for the skeleton. */
  readonly classes: readonly AmbiguityClass[]
  /** The Latin text aligned one group per Lontara syllable, plus a trailing group. */
  readonly groups: readonly string[]
  /** The writer trace proving this reading produces the input. Null for the skeleton. */
  readonly proof: TransliterationTrace | null
}

export type ReadingTreeNode = {
  readonly id: string
  /** Group index. -1 at the root. */
  readonly depth: number
  readonly latin: string
  /** Over the Lontara input clusters. */
  readonly inputSpan: Span
  /** Over this reading prefix's Latin clusters. */
  readonly outputSpan: Span
  readonly classes: readonly AmbiguityClass[]
  /**
   * One per distinct class among the children, and only where the children
   * actually diverge. A branch point is where the reading has corners — this is
   * the rhombus in the tree.
   */
  readonly ambiguities: readonly Ambiguity[]
  readonly readingCount: number
  readonly children: readonly ReadingTreeNode[]
  /** Non-null at a leaf. */
  readonly reading: Reading | null
}

export type EnumerationResult = {
  readonly direction: 'lontara-to-latin'
  readonly input: {
    readonly raw: string
    readonly normalized: string
    readonly clusters: readonly string[]
  }
  readonly units: readonly LontaraUnit[]
  /** What the script says on its own: inherent vowel throughout, nothing recovered. */
  readonly skeleton: Reading
  /** Attested readings, ranked. Empty when the lexicon attests none. */
  readonly readings: readonly Reading[]
  readonly tree: ReadingTreeNode
  readonly steps: readonly TraceStep[]
  readonly ambiguities: readonly Ambiguity[]
  /** Always all four. The script does not determine them, whatever the lexicon says. */
  readonly undetermined: readonly AmbiguityClass[]
  readonly basisNote: string
  readonly lexicon: { readonly version: string; readonly size: number; readonly empty: boolean }
  readonly cap: {
    readonly maxReadings: number
    readonly maxDepth: number
    readonly applied: boolean
    readonly dropped: number
  }
  readonly ruleSetVersion: string
  readonly reviewStatus: 'unreviewed' | 'reviewed'
}

const ALL_CLASSES: readonly AmbiguityClass[] = ['final', 'gemination', 'prenasal', 'glottal']

/** The Latin a Lontara unit writes, with nothing recovered. */
function readUnit(unit: LontaraUnit): string {
  if (unit.kind !== 'syllable') return ''
  return `${unit.letter.onset}${unit.sign ? unit.sign.latin : INVENTORY.inherentVowel.latin}`
}

/**
 * Split a reading's Latin into one group per Lontara syllable, plus a trailing
 * group. A group is the leading unwritten material — finals, glottal stops —
 * followed by the syllable it precedes; the trailing group is whatever closes
 * the word after the last syllable.
 */
function groupsOf(units: readonly LatinUnit[], clusters: readonly string[]): {
  groups: string[]
  classes: AmbiguityClass[][]
} {
  const groups: string[] = []
  const classes: AmbiguityClass[][] = []

  let buffer = ''
  let bufferClasses: AmbiguityClass[] = []

  units.forEach((unit, index) => {
    const text = clusters.slice(unit.span.start, unit.span.end).join('')

    switch (unit.kind) {
      case 'syllable':
        groups.push(buffer + text)
        classes.push(bufferClasses)
        buffer = ''
        bufferClasses = []
        return
      case 'final':
        buffer += text
        bufferClasses = [...bufferClasses, classifyFinal(units, index).ambiguityClass]
        return
      case 'glottal':
        buffer += text
        bufferClasses = [...bufferClasses, 'glottal']
        return
      case 'unhandled':
        buffer += text
        return
    }
  })

  // The trailing group always exists, even when empty, so that a word-final
  // consonant has somewhere to live and the group count is a function of the
  // syllable count alone.
  groups.push(buffer)
  classes.push(bufferClasses)

  return { groups, classes }
}

function readingFrom(
  latin: string,
  entries: readonly LexiconEntry[],
  lexicon: Lexicon,
  proof: TransliterationTrace | null,
): Reading {
  const clusters = toClusters(latin)
  const { units } = segmentLatin(clusters)
  const { groups, classes } = groupsOf(units, clusters)
  const flat = classes.flat()

  return {
    latin,
    attested: entries.length > 0,
    entries,
    band: bandOf(entries, lexicon),
    score: entries.length > 0 ? scoreReading(entries, lexicon, flat) : UNATTESTED_SCORE,
    classes: flat,
    groups,
    proof,
  }
}

function buildTree(
  readings: readonly Reading[],
  unitSpans: readonly Span[],
  inputClusterCount: number,
): ReadingTreeNode {
  /** groups.length is syllableCount + 1, identical across readings of one input. */
  const totalDepth = Math.max(0, ...readings.map((r) => r.groups.length))
  const endSpan = span(inputClusterCount, inputClusterCount)

  /**
   * The Lontara syllable a divergence at `depth` sits at. The trailing group has
   * no syllable of its own, so it points at the end of the input — which is
   * correct: a word-final consonant is unwritten *after* the last letter.
   */
  const spanAt = (depth: number): Span => unitSpans[depth] ?? endSpan

  /** Every reading under a node shares groups[0..depth], so the first one speaks for all. */
  const classesAt = (subset: readonly Reading[], depth: number): AmbiguityClass[] => {
    const first = subset[0]
    if (!first) return []
    const clusters = toClusters(first.latin)
    const { classes } = groupsOf(segmentLatin(clusters).units, clusters)
    return classes[depth] ?? []
  }

  function group(subset: readonly Reading[], depth: number): Map<string, Reading[]> {
    const out = new Map<string, Reading[]>()
    for (const r of subset) {
      const key = r.groups[depth] ?? ''
      const list = out.get(key) ?? []
      list.push(r)
      out.set(key, list)
    }
    return out
  }

  function childrenOf(
    id: string,
    depth: number,
    prefixLength: number,
    subset: readonly Reading[],
  ): ReadingTreeNode[] {
    if (depth >= totalDepth) return []
    return [...group(subset, depth).entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([text, members], index) => node(`${id}/${index}`, depth, text, prefixLength, members))
  }

  function node(
    id: string,
    depth: number,
    latin: string,
    prefixLength: number,
    subset: readonly Reading[],
  ): ReadingTreeNode {
    const width = toClusters(latin).length
    const children = childrenOf(id, depth + 1, prefixLength + width, subset)

    return {
      id,
      depth,
      latin,
      inputSpan: spanAt(depth),
      outputSpan: span(prefixLength, prefixLength + width),
      classes: classesAt(subset, depth),
      // The ambiguity belongs to the node the branch leaves from, but it is
      // ABOUT the syllable the children diverge at — so the span points there.
      ambiguities:
        children.length > 1
          ? ambiguitiesAt(children, spanAt(depth + 1), prefixLength + width)
          : [],
      readingCount: subset.length,
      children,
      reading: children.length === 0 ? (subset[0] ?? null) : null,
    }
  }

  const rootChildren = childrenOf('r', 0, 0, readings)

  return {
    id: 'r',
    depth: -1,
    latin: '',
    inputSpan: span(0, inputClusterCount),
    outputSpan: span(0, 0),
    classes: [],
    ambiguities: rootChildren.length > 1 ? ambiguitiesAt(rootChildren, spanAt(0), 0) : [],
    readingCount: readings.length,
    children: rootChildren,
    reading: null,
  }
}

/**
 * One `Ambiguity` per distinct class among the diverging children. `chosen` is
 * null throughout: the reader refuses to choose, which is the whole point.
 * Invariant 3 is satisfied by construction, since `reason` is always written.
 */
function ambiguitiesAt(
  children: readonly ReadingTreeNode[],
  inputSpan: Span,
  outputStart: number,
): Ambiguity[] {
  const candidates = children.map((c) => c.latin)
  const classes = [...new Set(children.flatMap((c) => c.classes))]

  const spans = { input: inputSpan, output: span(outputStart, outputStart) }

  if (classes.length === 0) {
    // Divergence with no class attached means the readings differ in something
    // the classifier does not account for. Say that, rather than picking a class.
    return [
      {
        class: 'final',
        candidates,
        chosen: null,
        reason:
          `Bacaan bercabang di sini menjadi ${candidates.length} kemungkinan, tetapi tidak satu pun ` +
          `kelas kerancuan menerangkan perbedaannya. Ini kekurangan pada pengelas, bukan pada aksara — laporkan.`,
        ruleId: rule('lontara.final.drop').id,
        spans,
      },
    ]
  }

  return classes.map((cls) => {
    const lossRule = RULE_SET.rules.find((r) => r.type === 'loss' && r.ambiguityClass === cls)
    return {
      class: cls,
      candidates,
      chosen: null,
      reason:
        `${lossRule?.description ?? ''} Aksara tidak menentukan pilihan di sini, jadi ` +
        `${candidates.length} kemungkinan dibiarkan terbuka.`,
      ruleId: lossRule?.id ?? rule('lontara.final.drop').id,
      spans,
    }
  })
}

export function enumerate(
  raw: string,
  lexicon: Lexicon,
  options: EnumerateOptions = {},
): EnumerationResult {
  const maxReadings = options.maxReadings ?? DEFAULT_MAX_READINGS
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH

  const normalized = normalize(raw, 'lontara-to-latin')
  const { units } = segmentLontara(normalized.clusters)

  const steps: TraceStep[] = []
  const syllableSpans: Span[] = []
  let skeletonLatin = ''

  for (const unit of units) {
    const at = toClusters(skeletonLatin).length

    if (unit.kind === 'syllable') {
      const latin = readUnit(unit)
      skeletonLatin += latin
      syllableSpans.push(unit.span)
      steps.push({
        type: 'read',
        ruleId: rule('lontara.syllable.compose').id,
        inputSpan: unit.span,
        outputSpan: span(at, at + toClusters(latin).length),
        outputSpanIn: 'output',
        letter: unit.letter.unicodeName,
        sign: unit.sign?.unicodeName ?? null,
        latin,
      })
      continue
    }

    if (unit.kind === 'punctuation') {
      steps.push({
        type: 'unhandled',
        ruleId: rule('lontara.syllable.compose').id,
        inputSpan: unit.span,
        outputSpan: span(at, at),
        outputSpanIn: 'output',
        text: unit.codepoint,
        why:
          `${unit.codepoint} tidak punya padanan Latin yang dapat dirujuk di repositori ini, ` +
          `jadi tidak dibaca menjadi apa pun — bukan ditebak. Lihat openQuestions.pallawa.`,
      })
      continue
    }

    steps.push({
      type: 'unhandled',
      ruleId: rule('lontara.syllable.compose').id,
      inputSpan: unit.span,
      outputSpan: span(at, at),
      outputSpanIn: 'output',
      text: unit.text,
      why: unit.why,
    })
  }

  // The depth cap is on syllables, and it is reported.
  const depthCapped = syllableSpans.length > maxDepth

  // Invert the writer over the lexicon. Entries sharing a Latin form are one
  // reading; entries with different Latin forms that write to the same Lontara
  // are different readings, which is exactly the one-to-many the script creates.
  const byLatin = new Map<string, LexiconEntry[]>()
  if (!depthCapped) {
    for (const entry of lexicon.entries) {
      const proof = interpret(entry.latin)
      if (proof.output.text !== normalized.text) continue
      const list = byLatin.get(entry.latin) ?? []
      list.push(entry)
      byLatin.set(entry.latin, list)
    }
  }

  const all = [...byLatin.entries()].map(([latin, entries]) =>
    readingFrom(latin, entries, lexicon, interpret(latin)),
  )

  const ranked = [...all].sort(
    (a, b) => b.score.total - a.score.total || a.latin.localeCompare(b.latin),
  )
  const readings = ranked.slice(0, maxReadings)
  const dropped = ranked.length - readings.length

  const skeleton = readingFrom(skeletonLatin, [], lexicon, null)
  const tree = buildTree(readings, syllableSpans, normalized.clusters.length)

  const collected: Ambiguity[] = []
  ;(function walk(node: ReadingTreeNode) {
    collected.push(...node.ambiguities)
    node.children.forEach(walk)
  })(tree)

  return {
    direction: 'lontara-to-latin',
    input: { raw, normalized: normalized.text, clusters: normalized.clusters },
    units,
    skeleton,
    readings,
    tree,
    steps,
    ambiguities: collected,
    undetermined: ALL_CLASSES,
    basisNote:
      'Penyebutan bacaan di sini digerakkan oleh leksikon: satu bacaan adalah lema yang, bila ' +
      'dituliskan ke Lontara, menghasilkan rangkaian ini. Jadi kelengkapannya bersifat relatif ' +
      'terhadap leksikon, bukan mutlak. Keempat kelas tetap tidak ditentukan oleh aksara, dan ' +
      'bacaan sah yang belum masuk leksikon tidak akan muncul di sini.',
    lexicon: { version: lexicon.version, size: lexicon.entries.length, empty: lexicon.isEmpty },
    cap: {
      maxReadings,
      maxDepth,
      applied: dropped > 0 || depthCapped,
      dropped,
    },
    ruleSetVersion: RULE_SET.version,
    reviewStatus: RULE_SET.reviewStatus,
  }
}
