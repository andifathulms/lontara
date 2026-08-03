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
| **M1** | Engine | Built. Rule schema and validator, segmenter, interpreter, trace, ambiguity type. 232 tests. |
| **M2** | Writer | Built. Every lossy class declared and traced, keyboard, orthography disclosure. |
| **M3** | Reader | Built, **not launched.** The reviewer gate is unmet. The lexicon holds 1,323 corpus-attested forms, which is enough to enumerate but not enough to trust. |
| **M4** | Explanation UI | Built. Band, connector strokes, rule trace panel, ambiguity panel. |
| **M5** | Reference | Script reference and orthography disclosure built, offline capability and URL-fragment sharing done. Glossary outstanding. |

### Three things are deliberately absent

**No Bugis reviewer.** `data/rules/reviewers.json` is empty, so `pnpm gate:check`
exits 1 and every page carries the unmet-gate notice. PRD §9: no reviewer, no
launch. This gates M3, it is the long-lead item on the project, and it is a
human task. See `data/rules/reviewers.md`.

**No dictionary.** The lexicon's 1,323 entries are `attestation: "corpus"` and
nothing stronger: the form occurs in Bugis Wikipedia article text, which does
**not** make it a Bugis word — the same corpus contains Indonesian, English and
Vietnamese place names, and nothing here can tell them apart. Every such reading
is badged in the UI and scored low. Every dictionary in PRD Appendix A is an
unextracted PDF with an unresolved copyright position. See
`data/lexicon/provenance.md`.

**No frequency bands.** Every entry is `band: "unknown"`, and the build fails if
a corpus-attested entry claims otherwise. 85% of the Wikipedia dump is
bot-generated French commune stubs; before de-botting, nine "common Bugis words"
each appeared in exactly 617–620 articles because they are the colour key of one
repeated map caption. A band is a claim about frequency and that corpus cannot
support one.

**Seven open questions, not filled in.** Including which consonants can close a
Bugis syllable — which is why enumeration is lexicon-driven rather than
structural. A structural enumerator seeded with a guessed inventory would
produce a confident-looking tree of readings that are not Bugis. See
`openQuestions` in `data/rules/rules.json`, rendered at `/ejaan`.

## Commands

```bash
pnpm dev
pnpm build                # static export to ./out; validates rules and lexicon first
pnpm preview              # serve ./out under the production basePath
pnpm test:run             # 232 tests
pnpm test:enumerate       # enumeration completeness — invariant 15
pnpm rules:validate       # schema, citations, priority conflicts, font coverage
pnpm rules:report         # every rule with citation and status — the reviewer's artefact
pnpm lexicon:validate     # per-entry provenance and schema
pnpm gate:check           # the reviewer gate; exits 1 while unmet
pnpm corpus:pairs         # attested Lontara-Latin pairs + rule agreement rate
pnpm lexicon:extract      # rebuild the lexicon from the Wikipedia dump
pnpm budget               # JS budget, PRD §12
pnpm fonts:subset         # regenerate the Noto Sans Buginese subset
pnpm render:conformance   # the by-eye rendering checklist
pnpm typecheck && pnpm lint
```

`rules:validate` and `lexicon:validate` are wired into `build` and CI and may
fail the deploy. Do not weaken them.

`build` also regenerates `out/sw.js` from the export it just produced. Offline
support depends on that precache list being accurate and a wrong list fails
*silently* — the site simply stops working on a train — so CI checks the list
against the files on disk in both directions and then fetches every entry.

## Offline and sharing

**Fully offline after first load** (PRD §12). `scripts/build-service-worker.mjs`
reads the export and emits a precache list; Next emits content-hashed chunk
names, so a hand-written list in `public/` would go stale on the next build. The
cache name is derived from the contents of the whole export, so cache-first is
unconditionally safe — nothing inside one version can go stale — and a deploy
that changes nothing does not invalidate anyone's cache.

No `skipWaiting` and no `clients.claim`, deliberately: the app router loads route
chunks lazily, so swapping the active worker mid-session could hand an already
loaded page chunks from a different build. A new version activates once the last
old tab closes.

**Shareable by URL fragment** (PRD §4). The value lives after the `#`, which is
never sent in the HTTP request — so a name someone is checking before committing
it to a signboard does not land in a Pages access log. A query string would.

## Attested practice, and what it corrected

Bugis Wikipedia articles carry `{{multiscript|<lontara>|<latin>}}` — a
community-authored pair from someone who writes Bugis. 97 of them are extracted
into `data/corpus/bugwiki-pairs.json` and `pnpm corpus:pairs` reports how well
the rule set agrees.

That measurement caught three real defects. rules v0.1.0 agreed with **56%** of
attested pairs; v0.2.0 agrees with **94%**:

- Latin `e` takes U+1A1B and `é` takes U+1A19 — the reverse of what the Unicode
  character names implied. The names are evidence about the *encoding*, never
  about Bugis Latin orthography.
- `é` was not a vowel in the rule set at all, so `sapéda` lost its whole `pé`
  syllable.
- The glottal stop is written `q` here, not only `'`.

Wikipedia is community practice, not an authority, and some pairs are plainly
wrong. `tests/corpus.test.ts` pins the agreement rate and requires every
remaining disagreement to be named and explained — including a check that no
explanation goes stale. Two findings are recorded and **deliberately not acted
on**: `ngp` → MPA and `nc` → NYCA, which are two instances and could be article
errors. They are a reason to ask a reviewer, not a reason to guess.

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
- **Icons:** the GitHub, LinkedIn and Instagram marks in the footer are the
  official paths from [Simple Icons](https://github.com/simple-icons/simple-icons)
  v16.28.0, CC0-1.0, inlined rather than fetched. The globe is drawn in
  `components/chrome/MakerSignature.tsx`. Brand marks remain the trademarks of
  their owners and are used here only to link to the author's own profiles.
- For **Javanese and Balinese**, [Nulisa](https://bennylin.github.io/transliterasijawa/)
  is the better tool and has covered them since 2012.
- Reviewers will be credited by name, with consent, when there are any.

Code MIT. Rule and lexicon data carry their own citations and licences per
entry.
