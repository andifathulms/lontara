/**
 * Rule-set integrity, checked at build time. Wired into `build` and CI and it
 * may fail the deploy (PRD §8). Do not weaken it.
 *
 * What it enforces:
 *   1. The rule set and the inventory parse against their schemas.
 *   2. Every rule has an id and a citation (invariant 2).
 *   3. No two rules in the same stage share a priority — the condition PRD §8
 *      states as "no two equal-priority rules match the same input", checked in
 *      the form the rule model can actually decide.
 *   4. Every ambiguity class used by a rule is declared, every declared class is
 *      used, and the set is exactly the four in the schema (invariant 3).
 *   5. Every `provisional` rule carries a note saying what is unverified.
 *   6. Open questions reference rules that exist; every provisional rule is
 *      covered by an open question, so nothing unverified ships unasked. An
 *      `affects` selector points only at codepoints and ambiguity classes that
 *      are really declared — the Ejaan page renders it as a count, and a
 *      selector aimed at nothing would print a confident zero.
 *   7. Every codepoint in inventory.json exists in the font we ship, read out of
 *      the font's own cmap. A transcription slip fails here, not on a reader's
 *      screen.
 *   8. `tests/reviewed/` has not drifted from its recorded checksums
 *      (invariant 11).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { RuleSetSchema, AMBIGUITY_CLASSES } from '../lib/rules/schema'
import { InventorySchema } from '../lib/rules/inventory'
import { readCmap, hex } from './lib/cmap'

const ROOT = process.cwd()
const problems: string[] = []
const notes: string[] = []

function fail(message: string) {
  problems.push(message)
}

// ── 1. Schemas ───────────────────────────────────────────────────────────────
const rulesRaw = JSON.parse(readFileSync(join(ROOT, 'data/rules/rules.json'), 'utf8'))
const inventoryRaw = JSON.parse(readFileSync(join(ROOT, 'data/rules/inventory.json'), 'utf8'))

const ruleSetResult = RuleSetSchema.safeParse(rulesRaw)
const inventoryResult = InventorySchema.safeParse(inventoryRaw)

if (!ruleSetResult.success) {
  for (const issue of ruleSetResult.error.issues) {
    fail(`rules.json ${issue.path.join('.')}: ${issue.message}`)
  }
}
if (!inventoryResult.success) {
  for (const issue of inventoryResult.error.issues) {
    fail(`inventory.json ${issue.path.join('.')}: ${issue.message}`)
  }
}

if (!ruleSetResult.success || !inventoryResult.success) {
  report()
  process.exit(1)
}

const ruleSet = ruleSetResult.data
const inventory = inventoryResult.data

// ── 2. Ids and citations ─────────────────────────────────────────────────────
const seenIds = new Set<string>()
for (const r of ruleSet.rules) {
  if (seenIds.has(r.id)) fail(`duplicate rule id: ${r.id}`)
  seenIds.add(r.id)
  if (r.citation.trim().length === 0) fail(`${r.id}: empty citation (invariant 2)`)
}

// ── 3. Priority conflicts within a stage ─────────────────────────────────────
const byStage = new Map<string, Map<number, string>>()
for (const r of ruleSet.rules) {
  const stage = byStage.get(r.stage) ?? new Map<number, string>()
  const clash = stage.get(r.priority)
  if (clash) {
    fail(
      `priority conflict in stage "${r.stage}": ${clash} and ${r.id} both at priority ${r.priority}. ` +
        `Equal priority means the order two rules apply in is undefined.`,
    )
  }
  stage.set(r.priority, r.id)
  byStage.set(r.stage, stage)
}

for (const r of ruleSet.rules) {
  if (!ruleSet.stages.includes(r.stage)) {
    fail(`${r.id}: stage "${r.stage}" is not declared in stages`)
  }
}

// ── 4. Ambiguity classes are a closed set, declared and used ─────────────────
const declared = new Set(Object.keys(ruleSet.ambiguityClasses))
const used = new Set(
  ruleSet.rules.flatMap((r) => (r.type === 'loss' ? [r.ambiguityClass] : [])),
)

for (const cls of AMBIGUITY_CLASSES) {
  if (!declared.has(cls)) {
    fail(`ambiguity class "${cls}" is in the schema but not declared in rules.json`)
  }
  if (!used.has(cls)) {
    fail(
      `ambiguity class "${cls}" is declared but no loss rule uses it. ` +
        `An undeclarable class cannot be surfaced, so the reader would silently never mention it.`,
    )
  }
}
for (const cls of declared) {
  if (!(AMBIGUITY_CLASSES as readonly string[]).includes(cls)) {
    fail(
      `ambiguity class "${cls}" is declared in rules.json but not in the schema. ` +
        `The set is closed (invariant 3) — adding one is a deliberate schema change.`,
    )
  }
}

// ── 5. Provisional rules must say what is unverified ─────────────────────────
for (const r of ruleSet.rules) {
  if (r.status === 'provisional' && !r.note) {
    fail(`${r.id}: status is provisional but there is no note saying what is unverified`)
  }
}

// ── 6. Open questions line up with the rules ─────────────────────────────────
for (const q of ruleSet.openQuestions) {
  for (const id of q.blocks) {
    if (!seenIds.has(id)) fail(`${q.id} blocks unknown rule id: ${id}`)
  }
}
const questioned = new Set(ruleSet.openQuestions.flatMap((q) => q.blocks))
for (const r of ruleSet.rules) {
  if (r.status === 'provisional' && !questioned.has(r.id)) {
    fail(
      `${r.id} is provisional but no open question covers it. ` +
        `Nothing unverified ships without a recorded question and someone to ask.`,
    )
  }
}

/*
 * An `affects` selector is rendered as a count of real forms on the Ejaan page,
 * so a selector pointing at a codepoint the script does not have would put a
 * confident zero next to a question — indistinguishable from "nothing depends
 * on this". Checked against the inventory the same way rules are.
 */
const inventoryCodepoints = new Set([
  ...inventory.consonants.map((c) => c.codepoint),
  ...inventory.vowelSigns.map((v) => v.codepoint),
  ...inventory.punctuation.map((p) => p.codepoint),
])

for (const q of ruleSet.openQuestions) {
  const affects = q.affects
  if (!affects) continue

  if (affects.kind === 'outputCodepoint') {
    for (const cp of affects.codepoints) {
      if (!inventoryCodepoints.has(cp)) {
        fail(`${q.id} is sized by ${cp}, which inventory.json does not declare`)
      }
    }
  }

  if (affects.kind === 'ambiguityClass' && !declared.has(affects.ambiguityClass)) {
    fail(
      `${q.id} is sized by ambiguity class "${affects.ambiguityClass}", ` +
        `which rules.json does not declare`,
    )
  }
}

// ── 7. Every inventory codepoint exists in the font we ship ──────────────────
const FONT = join(ROOT, 'vendor/fonts/NotoSansBuginese-Regular.ttf')
if (!existsSync(FONT)) {
  fail(`vendored font missing: ${FONT}`)
} else {
  const cmap = readCmap(FONT)
  const declaredCodepoints = [
    ...inventory.consonants.map((c) => c.codepoint),
    ...inventory.vowelSigns.map((v) => v.codepoint),
    ...inventory.punctuation.map((p) => p.codepoint),
  ]

  for (const cp of declaredCodepoints) {
    const value = Number.parseInt(cp.slice(2), 16)
    if (!cmap.has(value)) {
      fail(`inventory.json declares ${cp} but the shipped font does not map it`)
    }
  }

  // The other direction: a Buginese codepoint the font maps but the inventory
  // omits means the inventory is incomplete.
  for (const cp of cmap) {
    if (cp >= 0x1a00 && cp <= 0x1a1f && !declaredCodepoints.includes(hex(cp))) {
      fail(`the font maps ${hex(cp)} but inventory.json does not declare it`)
    }
  }

  if (inventory.block.assigned !== declaredCodepoints.length) {
    fail(
      `block.assigned is ${inventory.block.assigned} but the inventory lists ` +
        `${declaredCodepoints.length} code points`,
    )
  }

  // U+25CC is not Buginese but the script reference depends on it coming from
  // the same subset, or half the table renders in another face.
  if (!cmap.has(0x25cc)) {
    fail('the font does not map U+25CC DOTTED CIRCLE, which the script reference needs')
  }

  const subset = join(ROOT, 'public/fonts/noto-sans-buginese-subset.woff2')
  if (!existsSync(subset)) fail(`shipped subset missing: ${subset}`)
}

// Every onset the composition rules draw on must be non-empty except the vowel
// carrier, and no two consonants may share an onset — the writer would have no
// way to choose between them.
const onsets = new Map<string, string>()
for (const c of inventory.consonants) {
  const clash = onsets.get(c.onset)
  if (clash) {
    fail(`${c.codepoint} and ${clash} share the onset "${c.onset}" — the writer cannot choose`)
  }
  onsets.set(c.onset, c.codepoint)
}

// ── 8. Reviewed fixtures have not drifted ────────────────────────────────────
const REVIEWED_DIR = join(ROOT, 'tests/reviewed')
const CHECKSUMS = join(REVIEWED_DIR, 'checksums.json')

if (existsSync(CHECKSUMS)) {
  const recorded: Record<string, string> = JSON.parse(readFileSync(CHECKSUMS, 'utf8')).files ?? {}
  const present = readdirSync(REVIEWED_DIR).filter((f) => f.endsWith('.json') && f !== 'checksums.json')

  for (const [file, expected] of Object.entries(recorded)) {
    const path = join(REVIEWED_DIR, file)
    if (!existsSync(path)) {
      fail(`tests/reviewed/${file} is recorded but missing. A reviewer signed it off (invariant 11).`)
      continue
    }
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex')
    if (actual !== expected) {
      fail(
        `tests/reviewed/${file} has changed. It carries a named reviewer's sign-off and may not be ` +
          `modified (invariant 11). If the engine disagrees with it, the engine is wrong. ` +
          `Changing it means going back to that reviewer — a human task. Stop here.`,
      )
    }
  }
  for (const file of present) {
    if (!(file in recorded)) {
      fail(`tests/reviewed/${file} has no recorded checksum. Add it with the reviewer's sign-off.`)
    }
  }
  if (present.length === 0) {
    notes.push('tests/reviewed/ is empty — no reviewer has signed off on anything yet (PRD §9).')
  }
} else {
  notes.push('tests/reviewed/checksums.json is absent — nothing has been reviewed yet (PRD §9).')
}

// ── Report ───────────────────────────────────────────────────────────────────
const provisional = ruleSet.rules.filter((r) => r.status === 'provisional')
const derived = ruleSet.rules.filter((r) => r.status === 'derived')

if (ruleSet.reviewStatus === 'unreviewed') {
  notes.push(`rules.json reviewStatus is "unreviewed" — the reader must not ship (invariant 12).`)
}
if (provisional.length > 0) {
  notes.push(
    `${provisional.length} provisional rule(s): ${provisional.map((r) => r.id).join(', ')}`,
  )
}
if (derived.length > 0) {
  notes.push(`${derived.length} derived rule(s): ${derived.map((r) => r.id).join(', ')}`)
}
notes.push(`${ruleSet.openQuestions.length} open question(s) recorded and not guessed at.`)

report()

function report() {
  if (problems.length > 0) {
    console.error(`rules:validate — ${problems.length} masalah\n`)
    for (const p of problems) console.error(`  ✗ ${p}`)
    console.error('')
    process.exit(1)
  }
  console.log(`rules:validate — ${ruleSetResult.success ? ruleSet.rules.length : 0} aturan, lolos`)
  for (const n of notes) console.log(`  · ${n}`)
}
