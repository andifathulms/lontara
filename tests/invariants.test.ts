import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RULES, RULE_SET, OPEN_QUESTIONS } from '@/lib/rules/loader'
import { INVENTORY } from '@/lib/rules/inventory'
import { AMBIGUITY_CLASSES } from '@/lib/rules/schema'
import { LEXICON } from '@/lib/lexicon/loader'
import { interpret } from '@/lib/engine/interpret'
import { enumerate } from '@/lib/engine/enumerate'

/**
 * The invariants that are easy to break by accident, checked mechanically rather
 * than trusted to memory. `pnpm rules:validate` covers the rule data at build
 * time; this covers the code around it.
 */

const ENGINE_DIR = join(process.cwd(), 'lib/engine')
const engineFiles = readdirSync(ENGINE_DIR).filter((f) => f.endsWith('.ts'))

describe('invariant 5 — the engine is pure', () => {
  it('has files to check', () => {
    expect(engineFiles.length).toBeGreaterThan(4)
  })

  for (const file of engineFiles) {
    const source = readFileSync(join(ENGINE_DIR, file), 'utf8')

    it(`${file} imports no React, Next, or components`, () => {
      const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] ?? '')
      for (const specifier of imports) {
        expect(specifier).not.toMatch(/^react($|\/)/)
        expect(specifier).not.toMatch(/^react-dom($|\/)/)
        expect(specifier).not.toMatch(/^next($|\/)/)
        expect(specifier).not.toMatch(/^@\/components\//)
      }
    })

    it(`${file} touches no browser globals`, () => {
      // Comments are stripped first so that prose mentioning `document` or the
      // DOM does not trip the check — the point is what the code does.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '')
      expect(code).not.toMatch(/\bwindow\./)
      expect(code).not.toMatch(/\bdocument\./)
      expect(code).not.toMatch(/\blocalStorage\b/)
      expect(code).not.toMatch(/\bnavigator\./)
    })

    it(`${file} reads no clock and no randomness`, () => {
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '')
      expect(code).not.toMatch(/\bDate\.now\b/)
      expect(code).not.toMatch(/new Date\b/)
      expect(code).not.toMatch(/Math\.random\b/)
      expect(code).not.toMatch(/performance\.now\b/)
    })

    it(`${file} declares no module-level mutable state`, () => {
      // `let` and `var` at column zero are module scope. Inside functions they
      // are indented, and the engine is written that way throughout.
      expect(source).not.toMatch(/^(let|var)\s/m)
    })
  }
})

describe('invariant 5 — the engine is a function of its arguments', () => {
  it('interpret returns an equal trace for equal input', () => {
    expect(interpret('mata')).toEqual(interpret('mata'))
  })

  it('enumerate returns an equal result for equal input', () => {
    const target = interpret('mata').output.text
    expect(enumerate(target, LEXICON)).toEqual(enumerate(target, LEXICON))
  })
})

describe('invariant 1 — no orthographic rule lives in application code', () => {
  const dirs = ['lib/engine', 'components', 'app']

  function walk(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) out.push(...walk(path))
      else if (/\.tsx?$/.test(entry.name)) out.push(path)
    }
    return out
  }

  const files = dirs.flatMap(walk)

  it('finds the source tree', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('no file outside data/rules/ contains a hard-coded rule id', () => {
    // Rule ids may be *referenced* by name — the engine has to ask for them —
    // but a literal id that is NOT in rules.json means a rule was invented in
    // code, which is the failure invariant 1 exists to prevent.
    const known = new Set(RULES.map((r) => r.id))
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      const referenced = [...source.matchAll(/'((?:lontara|latin)\.[a-z0-9.]+)'/g)].map(
        (m) => m[1] ?? '',
      )
      for (const id of referenced) {
        expect(known, `${file} references unknown rule id ${id}`).toContain(id)
      }
    }
  })
})

describe('invariant 3 — the ambiguity class set is closed', () => {
  it('rules.json declares exactly the four classes in the schema', () => {
    expect(Object.keys(RULE_SET.ambiguityClasses).sort()).toEqual([...AMBIGUITY_CLASSES].sort())
  })

  it('every class has a loss rule that can surface it', () => {
    for (const cls of AMBIGUITY_CLASSES) {
      expect(RULES.some((r) => r.type === 'loss' && r.ambiguityClass === cls)).toBe(true)
    }
  })
})

describe('invariant 2 — every rule carries a citation', () => {
  for (const r of RULES) {
    it(`${r.id}`, () => {
      expect(r.citation.trim().length).toBeGreaterThan(19)
      if (r.status === 'provisional') {
        expect(r.note).toBeTruthy()
        expect(OPEN_QUESTIONS.some((q) => q.blocks.includes(r.id))).toBe(true)
      }
    })
  }
})

describe('invariant 13 — every lexicon entry has provenance', () => {
  it('every entry carries a source, a real licence and a locator', () => {
    // Asserted in aggregate rather than one test per entry: at 1,323 entries
    // the per-entry form drowned the rest of the suite in noise.
    for (const entry of LEXICON.entries) {
      expect(entry.provenance.source.length).toBeGreaterThan(3)
      expect(entry.provenance.licence.toLowerCase()).not.toBe('unknown')
      expect(entry.provenance.locator.length).toBeGreaterThan(0)
      expect(entry.provenance.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('no corpus-attested entry claims a frequency band', () => {
    // A corpus occurrence says the form OCCURS, never how often. The corpus is
    // 85% bot-generated, so a band drawn from it would describe a template.
    for (const entry of LEXICON.entries) {
      if (entry.attestation === 'corpus') expect(entry.band).toBe('unknown')
    }
  })

  it('every entry is writable by the rule set', () => {
    // An entry the writer cannot produce could never be reached by the
    // reader's enumeration, so it would sit there looking like coverage.
    for (const entry of LEXICON.entries) {
      const trace = interpret(entry.latin)
      expect(trace.steps.some((s) => s.type === 'unhandled')).toBe(false)
      expect(trace.output.text.length).toBeGreaterThan(0)
    }
  })

  it('keeps the glottal stop, which is a whole ambiguity class', () => {
    // Stripping trailing apostrophes during extraction would silently destroy
    // it — `salo'` would become `salo`. These forms prove it did not happen.
    const withGlottal = LEXICON.entries.filter((e) => e.latin.includes("'"))
    expect(withGlottal.length).toBeGreaterThan(20)
  })
})

describe('invariant 14 — Bugis only', () => {
  it('the inventory contains nothing outside the Buginese block', () => {
    const codepoints = [
      ...INVENTORY.consonants.map((c) => c.codepoint),
      ...INVENTORY.vowelSigns.map((v) => v.codepoint),
      ...INVENTORY.punctuation.map((p) => p.codepoint),
    ]
    for (const cp of codepoints) {
      const value = Number.parseInt(cp.slice(2), 16)
      expect(value).toBeGreaterThanOrEqual(0x1a00)
      expect(value).toBeLessThanOrEqual(0x1a1f)
    }
  })

  it('the shipped font subset drops U+A9CF JAVANESE PANGRANGKEP', () => {
    // The upstream face maps it. The subset must not, or the app would ship a
    // Javanese glyph — see scripts/fonts-subset.mjs.
    const script = readFileSync(join(process.cwd(), 'scripts/fonts-subset.mjs'), 'utf8')
    const unicodes = /UNICODES = '([^']+)'/.exec(script)?.[1]
    expect(unicodes).toBe('U+1A00-1A1F,U+0020,U+00A0,U+25CC')
    // The comment above the constant names A9CF to explain why it is excluded,
    // so the assertion is against the subset list itself, not the file text.
    expect(unicodes).not.toMatch(/A9CF/i)
  })
})

describe('invariant 16 — transliteration is not translation', () => {
  const uiFiles = ['lib/i18n/copy.ts']

  it('the word "translate" appears only where it is being denied', () => {
    for (const file of uiFiles) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      const lines = source.split('\n')
      for (const [index, line] of lines.entries()) {
        if (!/menerjemah|terjemah|translat/i.test(line)) continue
        // Every occurrence must sit inside the notTranslator copy or a comment
        // explaining the rule.
        const context = lines.slice(Math.max(0, index - 6), index + 1).join('\n')
        expect(
          /notTranslator|invariant 16|tidak menerjemahkan|does not translate/i.test(context),
          `${file}:${index + 1} mentions translation outside the disclaimer: ${line.trim()}`,
        ).toBe(true)
      }
    }
  })

  it('no lexicon gloss is exposed by the engine', () => {
    // `gloss` is for reviewer verification only and is never rendered. Nothing
    // in the reading type should carry it.
    const target = interpret('mata').output.text
    const result = enumerate(target, LEXICON)
    const serialised = JSON.stringify(result)
    expect(serialised).not.toMatch(/"gloss"/)
  })
})

describe('invariant 16 — transliteration is not translation', () => {
  /*
   * PRD §6.4 wants a gloss per lexicon entry; invariant 16 forbids the UI from
   * producing, implying or labelling meaning. Both hold at once only because
   * the field stops at the data layer: a gloss is there so a reviewer can
   * confirm which word an entry is, and for nothing else.
   *
   * That is currently true by a comment on the schema, which is not a
   * guarantee. One `{entry.gloss}` in a reading tree and this tool starts
   * looking like a dictionary that also converts script — which is precisely
   * the confusion §4 says users already arrive with.
   */
  function walkUi(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) out.push(...walkUi(path))
      else if (/\.tsx?$/.test(entry.name)) out.push(path)
    }
    return out
  }

  const uiFiles = [...walkUi('components'), ...walkUi('app')]

  it('finds the UI tree', () => {
    expect(uiFiles.length).toBeGreaterThan(10)
  })

  it('no component or page reads a gloss', () => {
    for (const file of uiFiles) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect(source, `${file} touches a gloss; invariant 16 says the UI never shows meaning`).not.toMatch(
        /\bgloss\b/,
      )
    }
  })

  it('the lexicon type still carries gloss, so reviewers keep their field', () => {
    const schema = readFileSync(join(process.cwd(), 'lib/lexicon/loader.ts'), 'utf8')
    expect(schema).toMatch(/gloss:/)
  })

  it('no UI string offers to translate', () => {
    /*
     * The word belongs in exactly one place in this project — the sentence
     * that denies it, which lives in copy.ts and is checked separately below.
     *
     * `\b` is too blunt here: Tailwind's `-translate-x-1/2` and
     * `translate-y-0.5` are transforms, and a hyphen is a word boundary. So
     * the English forms must not be adjacent to `-` or a word character on
     * either side. No CSS class contains `terjemah`, so the Indonesian form
     * needs no such care and is matched anywhere, prefixes included.
     */
    const ENGLISH = /(?<![-\w])(translate|translated|translating|translation)(?![-\w])/i
    const INDONESIAN = /terjemah/i

    for (const file of uiFiles) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect(source, `${file} uses the word "translate"`).not.toMatch(ENGLISH)
      expect(source, `${file} uses the word "terjemah"`).not.toMatch(INDONESIAN)
    }
  })

  it('copy.ts uses the word only to deny it', () => {
    const copySource = readFileSync(join(process.cwd(), 'lib/i18n/copy.ts'), 'utf8')
    const denials = copySource.match(/(does not translate|tidak menerjemahkan)/g) ?? []
    expect(denials.length, 'both locales must carry the denial').toBe(2)
  })
})
