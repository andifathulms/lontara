# Lontara

**Penjelas baca-tulis aksara Lontara untuk Basa Ugi.** Menyebut satu per satu
apa yang tidak ditentukan oleh aksara, dan menjelaskan setiap pilihan
berdasarkan aturan.

A Lontara reading and writing explainer for Bugis. It enumerates what the script
leaves undetermined, and explains every choice by rule.

Static site, GitHub Pages, no backend. **Bugis (Basa Ugi) only** — not
Makassarese, not Mandar, not Javanese, not Balinese, and not the Makasar script.

**This is not a translator.** It converts script and nothing else. It does not
produce meaning.

**This is a personal project, not an authority, and it can be wrong.**

---

## The property this is built around

Lontara is a **defective** abugida. The Unicode Buginese block
(U+1A00–U+1A1F) has 23 consonant letters, five vowel signs, two punctuation
marks — and **no virama**. There is no mechanism in the encoding for a bare
consonant, so the orthography does not write syllable-final consonants,
geminates, prenasalisation, or the glottal stop.

`mata`, `matta` and `manta` are written identically.

| Direction | Property |
|---|---|
| Latin → Lontara | Deterministic but **lossy**. What is discarded is predictable and enumerable. |
| Lontara → Latin | **One-to-many.** A string has many valid readings. |

That asymmetry is the product. Not the conversion — the enumeration.

## Where this actually is

Read `PRD.md` for scope and `CLAUDE.md` for how to work in the repo.

| | | |
|---|---|---|
| **M0** | Rendering + scaffold | Built. Static export deploys, Noto Sans Buginese subset with licence recorded, conformance page ready — **but not yet eyeballed on any device.** `pnpm render:conformance` reports 60 unchecked rows. |
| **M1** | Engine | Built. Rule schema and validator, segmenter, interpreter, trace, ambiguity type. 180 tests. |
| **M2** | Writer | Built. Every lossy class declared and traced, keyboard, orthography disclosure. |
| **M3** | Reader | Built, **not launched.** The reviewer gate is unmet, and the lexicon is empty. |
| **M4** | Explanation UI | Built. Band, connector strokes, rule trace panel, ambiguity panel. |
| **M5** | Reference | Script reference and orthography disclosure built. Glossary and offline polish outstanding. |

### Three things are deliberately absent

**No Bugis reviewer.** `data/rules/reviewers.json` is empty, so `pnpm gate:check`
exits 1 and every page carries the unmet-gate notice. PRD §9: no reviewer, no
launch. This gates M3, it is the long-lead item on the project, and it is a
human task. See `data/rules/reviewers.md`.

**An empty lexicon.** Every source in PRD Appendix A is an unextracted PDF and
several have unresolved copyright positions, so nothing could be added without
breaking invariant 13. The reader is lexicon-driven, so with no entries it
states the syllable skeleton and says it can state nothing more. See
`data/lexicon/provenance.md`.

**Six open questions, not filled in.** Including which consonants can close a
Bugis syllable — which is why enumeration is lexicon-driven rather than
structural. A structural enumerator seeded with a guessed inventory would
produce a confident-looking tree of readings that are not Bugis. See
`openQuestions` in `data/rules/rules.json`, rendered at `/ejaan`.

## Commands

```bash
pnpm dev
pnpm build                # static export to ./out; validates rules and lexicon first
pnpm preview              # serve ./out under the production basePath
pnpm test:run             # 180 tests
pnpm test:enumerate       # enumeration completeness — invariant 15
pnpm rules:validate       # schema, citations, priority conflicts, font coverage
pnpm rules:report         # every rule with citation and status — the reviewer's artefact
pnpm lexicon:validate     # per-entry provenance and schema
pnpm gate:check           # the reviewer gate; exits 1 while unmet
pnpm fonts:subset         # regenerate the Noto Sans Buginese subset
pnpm render:conformance   # the by-eye rendering checklist
pnpm typecheck && pnpm lint
```

`rules:validate` and `lexicon:validate` are wired into `build` and CI and may
fail the deploy. Do not weaken them.

## How it is put together

```
input + direction + options + ruleSet + lexicon
  → normalize    NFC, input-variant resolution
  → segment      grapheme clusters, (C)V structure
  → classify     which loss rule accounts for each leftover
  → interpret    defaulting traversal   → TransliterationTrace
  → enumerate    expanding traversal    → reading tree
  → rank         lexicon scoring
```

**Rules are data, not code.** `data/rules/rules.json` carries every rule with an
id, priority and citation. `lib/engine/` is an interpreter over it. This exists
so a Bugis-literate reviewer who does not program can audit the orthography —
which is the whole point of PRD §9. `pnpm rules:report` prints it readably.

**The engine is pure.** No React, no DOM, no clock, no module-level mutable
state. Enforced by an eslint override and by `tests/invariants.test.ts`, not by
memory.

**Ambiguity is a type, not a warning string.** `{ class, candidates, chosen,
reason, spans }`. `reason` is required, so a `chosen` without one cannot be
constructed. The four classes are a closed set.

**Every trace step carries input and output spans**, and says which cluster
array its output span indexes — normalisation happens before any aksara exists,
so there are genuinely two coordinate spaces and conflating them would mislink
every connector stroke.

**Never a bijection.** The correct property is enumeration completeness: write a
Latin form to Lontara, enumerate back, and assert the original is in the reading
set. Never an exact round-trip — that would be asserting something false.

## Contributing

If you read Lontara — especially manuscript Lontara — the most useful thing you
can do here is tell us what is wrong. `pnpm rules:report` prints the whole
orthography in one readable pass, and `/ejaan` shows the same thing in the
browser. The provisional rules and the open questions are the places to start.

Do not add an orthographic rule you cannot cite. Marking it unverified, or
leaving it out and flagging it, is better than confident wrongness — that is the
specific failure this project has to avoid.

## Credits and licences

- **Aksara:** Noto Sans Buginese 2.002, OFL-1.1. **Latin:** Gentium Plus,
  OFL-1.1, chosen because this project needs `' ə ŋ ñ á` to render consistently.
  **Annotation:** Space Mono, OFL-1.1. All self-hosted and subset — see
  [`public/fonts/LICENSES.md`](public/fonts/LICENSES.md).
- For **Javanese and Balinese**, [Nulisa](https://bennylin.github.io/transliterasijawa/)
  is the better tool and has covered them since 2012.
- Reviewers will be credited by name, with consent, when there are any.

Code MIT. Rule and lexicon data carry their own citations and licences per
entry.
