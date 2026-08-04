# PORTFOLIO_CONTEXT — Lontara

Raw material for a client-facing case study. Everything below is checked against the
repository as of commit `419d215` (2026-08-04), not against the PRD's intentions.

---

## 1. One-line summary

A free web tool for reading and writing the Lontara script of the Bugis language — it
converts between Lontara and Latin letters, and, crucially, tells you every *possible*
reading when the script itself doesn't say which word is meant.

## 2. The problem

Lontara is a **defective** script: the Unicode Buginese block (U+1A00–U+1A1F) has 23
consonants, five vowel signs, and **no virama** — no way to write a bare consonant. So
the script never records syllable-final consonants, doubled consonants, prenasalisation,
or the glottal stop. `mata`, `matta` and `manta` are all written identically. A human
reader recovers the intended word from vocabulary and context.

Existing converters hide this. They take Lontara in and emit one confident Latin string,
which is a guess presented as an answer. The consequences are real and specific:

- A **signmaker** puts a misspelled name on a permanent sign.
- A **learner** is taught a rule that doesn't exist, and the tool substitutes for the
  knowledge instead of building it.
- Someone reading **family documents or manuscripts** gets one reading where six are
  valid, with no indication that a choice was made at all.

Audience, in priority order: Bugis readers working with real documents; learners of Basa
Ugi; philology/linguistics students who need correct diacritics and codepoints; designers
and signmakers who need one short string to be right.

The product isn't the conversion. It's the **enumeration** — naming what the script leaves
undetermined, and citing a rule for every step it does take.

## 3. My role

Sole author. Everything in the repository is mine: the PRD, the rule schema, the engine,
all UI, the build/validation tooling, the CI pipeline, the corpus extraction, and the
brand mark (*sulapa' eppa'*, drawn as vector masters in `exports/`).

Used as-is, not built:

- **Next.js 14 / React 18 / Tailwind / Zod / Vitest** — the only four runtime/dev
  libraries in `package.json`. There is deliberately **no transliteration library**; the
  rule interpreter *is* the project.
- **Fonts**: Noto Sans Buginese 2.002, Gentium Plus, Space Mono — all OFL-1.1, self-hosted
  and subset by `scripts/fonts-subset.mjs`, licences recorded in `public/fonts/LICENSES.md`.
- **Simple Icons** v16.28.0 CC0 paths for the three social marks in the footer, inlined.
- **Data sources**: the Unicode code chart, and the Bugis Wikipedia dump (CC BY-SA 4.0)
  as the lexicon and attestation corpus.

Not done, and deliberately visible: **no Bugis reviewer has signed off.**
`data/rules/reviewers.json` is an empty array, `pnpm gate:check` exits 1, and every page
carries an unmet-gate notice. That is a human/outreach task, and by the project's own
rules it blocks launching the reader.

## 4. Technical approach

**Orthographic rules are data, not code.** All 11 rules live in `data/rules/rules.json`
with an id, stage, priority, status (`cited` / `provisional` / `derived`) and a citation
string. `lib/engine/` is a small interpreter over that file. The reason is not elegance —
it's that a Bugis-literate reviewer who doesn't program has to be able to audit the
orthography. `pnpm rules:report` prints the whole rule set in one readable pass, and
`/ejaan` renders the same data in the browser.

**The engine is pure.** Signature is `(input, direction, options, ruleSet, lexicon) =>
TransliterationTrace`. No React, no DOM, no clock, no module-level mutable state — enforced
by an eslint override *and* by `tests/invariants.test.ts`, so it can't drift.

**One rule set, two traversals.** `interpret.ts` is the writer (defaults, and *declares*
what it discarded). `enumerate.ts` is the reader (expands into a tree of readings). The
rule data is never forked per direction — if the directions needed different rules, the
rule model would be wrong.

**Ambiguity is a type, not a warning string.** `{ class, candidates, chosen, reason, spans }`
where `reason` is required, so a resolved ambiguity without a justification is
unconstructable. The four classes — `final`, `gemination`, `prenasal`, `glottal` — are a
closed set; adding one is a deliberate schema change.

**The reader is lexicon-driven, not structural.** The obvious design branches at each
syllable over every consonant that could close it — but that needs an inventory of Bugis
final consonants, and the repo can't cite one (`openQuestions.final-inventory`). Guessing
it would produce a confident-looking tree of readings that aren't Bugis. So enumeration
*inverts the writer over the lexicon*: a reading is a lexicon entry which, run through
`interpret`, produces exactly this Lontara string. No uncited rule about finals is needed,
and every reading carries the writer trace that proves it. The cost — completeness is
relative to the lexicon, not absolute — is stated on every result rather than hidden.

**Two coordinate spaces, kept separate.** Every trace step carries input and output spans
*and says which cluster array its output span indexes*, because normalisation happens
before any aksara exists. Conflating the two would mislink every connector stroke on the
band — which it did, once (commit `18362ac`).

**Unicode discipline as a hard rule.** NFC normalisation, `Intl.Segmenter` for grapheme
clusters, never `str[i]` or `.split('')` for glyph logic. This is the single most common
defect in aksara tooling.

**The build is a gate, not a formality.** `pnpm build` runs rules and lexicon validation
first and CI can fail the deploy on either. CI additionally enforces the 200 KB gzipped JS
budget, asserts `.nojekyll` and the `/lontara` basePath survived the export, and verifies
the generated service worker's precache list against the files actually on disk in both
directions — then boots a server and fetches every precached URL, because a wrong precache
list fails *silently* (the site just stops working on a train).

## 5. Actual tech stack

Verified against `package.json`, not the PRD.

| | |
|---|---|
| **Framework** | Next.js 14.2.15, App Router, `output: 'export'` — fully static |
| **UI** | React 18.3.1, Tailwind CSS 3.4.13 |
| **Language** | TypeScript 5.6.3, `strict: true`, no `any`, no non-null `!` in engine code |
| **Validation** | Zod 3.23.8 — rule-set and lexicon schemas |
| **Tests** | Vitest 2.1.3 |
| **Tooling** | tsx, ESLint 8 + eslint-config-next, PostCSS, autoprefixer |
| **Package manager** | pnpm 9.15.9, Node ≥ 20 |
| **Hosting** | GitHub Pages via GitHub Actions (`validate` → `build` → `deploy`) |
| **Offline** | Hand-written service worker generated at build time from the real export |
| **Runtime deps total** | **four**: next, react, react-dom, zod |

No transliteration library, no ML, no analytics, no backend, no database, no accounts, no
runtime fetches. Unicode normalisation and segmentation use the built-in
`String.prototype.normalize` and `Intl.Segmenter` — adding a dependency for either is
explicitly forbidden in `CLAUDE.md`.

## 6. Notable features

- **The reader (`/baca`)** — paste Lontara, get a *tree* of plausible Latin readings.
  Branch points are rhombi (*sulapa' eppa'*, the four-cornered Bugis form) labelled with
  the ambiguity class that caused them; leaves are complete readings ranked against the
  lexicon, with every scoring component named so the ranking can be argued with.
- **The writer (`/tulis`)** — type Bugis Latin, get Lontara on a palm-leaf band with
  connector strokes linking each Latin cluster to the glyph it produced, and the discarded
  information marked *on the connector that dropped it* rather than summarised in a footer.
  Click a rule in the trace panel to highlight the glyphs it made.
- **On-screen Lontara keyboard** in traditional *ka-ga-nga* order, with vowel signs as
  modifiers — most devices have no system Lontara keyboard at all, so without this the
  tools are unusable on a phone.
- **Rule trace + orthography disclosure (`/ejaan`)** — every applied rule with its span, id
  and citation, plus the seven open questions rendered straight out of the rule data rather
  than hand-written prose that could go stale.
- **Script reference (`/aksara`)** with the full 23-consonant inventory, Bugis names,
  codepoints, and a rendering conformance page (`/aksara/konformansi`) carrying 12 hard
  strings for by-eye checking on real devices. A codepoint view is available everywhere as
  the fallback when rendering fails.
- **Offline after first load, shareable by URL fragment** — the value lives after the `#`,
  which is never sent in the HTTP request, so a name someone is checking before committing
  it to a signboard never lands in a Pages access log. A query string would.
- **Print sheet** — the writer's output as something you can carry into a workshop.
- **Bilingual** — Indonesian-first, English secondary, Bugis terminology throughout
  (`baca`, `tulis`, `aksara`, `pallawa`); locale-routed at `/id` and `/en`.

## 7. Challenges and tradeoffs

**Scope cut, before a line was written.** Originally specced as a three-script tool
(Lontara + Javanese + Balinese). Cut to Bugis only: Javanese and Balinese need stacked
*pasangan*/*gantungan* and dozens of OpenType features, where Noto Sans Buginese ships 41
glyphs and 2 features — so the rendering risk nearly vanishes. It also means one cultural
reviewer to find instead of three, and Bugis is the underserved script where nobody has
built the enumerator at all. Nulisa is linked warmly as the better tool for Javanese and
Balinese rather than competed with.

**The rule set was 56% wrong, and measurement caught it.** Bugis Wikipedia articles carry
`{{multiscript|<lontara>|<latin>}}` — community-authored pairs from people who actually
write Bugis. Extracting 97 of them (`4bee139`) and scoring the rule set against them showed
**56% agreement**. Three real defects surfaced (`4525287`, 56% → **94%**):

- Latin `e` takes U+1A1B and `é` takes U+1A19 — *the reverse* of what the Unicode character
  names implied. The names are evidence about the encoding, never about Bugis Latin
  orthography.
- `é` wasn't in the rule set as a vowel at all, so `sapéda` silently lost its whole `pé` syllable.
- The glottal stop is written `q` in practice, not only `'`.

`tests/corpus.test.ts` now pins the agreement rate and requires every remaining
disagreement to be named and explained — including a check that no explanation has gone
stale. Two findings (`ngp` → MPA, `nc` → NYCA) are recorded and **deliberately not acted
on**: two instances each, possibly article errors. They're a reason to ask a reviewer, not
a reason to guess.

**The lexicon is honest about being weak.** All 1,323 entries are
`attestation: "corpus"` and `band: "unknown"`, and the validator *fails the build* if a
corpus-attested entry claims a frequency band. Reason: 85% of the Wikipedia dump is
bot-generated French commune stubs, and before de-botting, nine "common Bugis words" each
appeared in exactly 617–620 articles — because they were the colour key of one repeated map
caption. The corpus cannot support a frequency claim, so none is made. It also contains
Indonesian, English and Vietnamese place names that nothing here can distinguish from Bugis
words, so every such reading is badged in the UI and scored low. Every real dictionary in
the PRD's appendix is an unextracted PDF with an unresolved copyright position.

**Choosing a lexicon-driven enumerator over a structural one** (see §4) is the central
tradeoff: it trades absolute completeness for the guarantee that no reading is invented
from a guessed rule. Given that the project's defining failure mode is confident wrongness,
that's the right trade — but it makes the reader's usefulness a direct function of lexicon
quality, which is currently the weakest part of the system, and the README says so.

**A launch gate that is enforced in code and not met.** `pnpm gate:check` exits 1, CI runs
it with `continue-on-error: true` so it's loud on every run without blocking the *writer*
and the conformance page from being built for a reviewer to look at. Nothing in the repo can
quietly bypass it.

**Smaller ones worth mentioning:** connector strokes pointed at the wrong glyph until the
two coordinate spaces were separated (`18362ac`); the service worker deliberately omits
`skipWaiting`/`clients.claim`, because the app router loads route chunks lazily and swapping
the worker mid-session could hand a loaded page chunks from a different build; the CI pnpm
version is pinned only in `packageManager`, since pinning it in both places makes
`action-setup` refuse to run (`9b9504f`); and the name "Lontara" was chosen knowing it's
poor for search — **Urupu**, the endonym, is the documented fallback.

## 8. Status

- **Live**: yes — <https://andifathulms.github.io/lontara/> returns 200, deployed by
  GitHub Actions on push to `main`.
- **Repo**: **public**, `github.com/andifathulms/lontara`, code MIT; rule and lexicon data
  carry their own per-entry citations and licences.
- **Maturity**: working software, deployed, 281 passing tests and a validating build —
  but **not launched**, by its own rules. The reader is complete and reachable, and the
  unmet reviewer-gate notice appears on every page. M0's rendering conformance page exists
  but reports 60 unchecked rows: it has not yet been eyeballed on a real device.
- Milestones M0–M5 are all built to some degree; M5's glossary is outstanding.

## 9. Metrics

| | |
|---|---|
| **Commits** | 35, all on `main` |
| **Time span** | 2026-07-30 → 2026-08-04 (6 calendar days; 3 active days: 18 / 15 / 2 commits) |
| **Total diff** | 104 files, 28,863 insertions |
| **Source LOC** | ~9,300 — `lib/` 2,576 · `components/` 2,009 · `tests/` 1,955 · `scripts/` 1,643 · `app/` 1,096 |
| **Data LOC** | 18,634 lines of JSON/Markdown in `data/` |
| **Tests** | **281 passing** in 6 files — writer 127, invariants 59, enumeration completeness 47, share 23, brand 13, corpus 12 (README's "232" is stale) |
| **Pages** | 6 routes × 2 locales = 12 static pages: `/`, `/baca`, `/tulis`, `/aksara`, `/aksara/konformansi`, `/ejaan` |
| **Rule set** | v0.2.0 — 11 rules across 4 stages (5 `cited`, 2 `provisional`, 4 `derived`), 4 ambiguity classes, **7 open questions recorded rather than guessed** |
| **Lexicon** | 1,323 entries, 100% with per-entry provenance, all `band: "unknown"` |
| **Corpus** | 97 attested Lontara–Latin pairs; rule agreement 94% (was 56%) |
| **Rendering** | 12 hard strings, 60 conformance rows, 0 checked by eye |
| **Runtime deps** | 4 |
| **Font payload** | 76 KB of subset woff2 for three faces |
| **Reviewers** | 0 — the launch gate |

## 10. Suggested screenshots

1. **The reading tree — the flagship shot.** `/id/baca` with a genuinely ambiguous string
   entered, tree expanded so several rhombus branch points and their class labels are
   visible, and one leaf's score breakdown open.
   → [components/tree/ReadingTree.tsx](components/tree/ReadingTree.tsx),
   [components/ambiguity/Rhombus.tsx](components/ambiguity/Rhombus.tsx),
   [components/reader/ReaderTool.tsx](components/reader/ReaderTool.tsx)

2. **The band with connector strokes and a marked loss.** `/id/tulis` with a word whose
   final consonant is dropped, so a connector carries a loss marker in `daun` green (the
   colour reserved exclusively for ambiguity), Latin line beneath the aksara.
   → [components/band/Band.tsx](components/band/Band.tsx),
   [components/writer/WriterTool.tsx](components/writer/WriterTool.tsx),
   [lib/engine/band.ts](lib/engine/band.ts)

3. **The rule trace panel with a rule selected**, highlighting the glyphs it produced —
   this is the "explains every choice by rule, with a citation" claim made visible, and it
   shows the rules-as-data architecture without needing to open a file.
   → [components/trace/TracePanel.tsx](components/trace/TracePanel.tsx)

4. **The on-screen Lontara keyboard in *ka-ga-nga* order**, ideally at phone width — it
   makes the "no system keyboard exists for this script" problem legible in one image.
   → [components/keyboard/Keyboard.tsx](components/keyboard/Keyboard.tsx)

5. *(optional, and the most honest one)* **`/id/ejaan`** showing the seven open questions
   and the `provisional` rule badges rendered straight from the rule data, or the unmet
   reviewer-gate notice. Nothing else in the case study demonstrates the project's actual
   thesis — declare what you don't know — as directly.
   → [app/\[locale\]/ejaan/page.tsx](app/[locale]/ejaan/page.tsx),
   [components/chrome/Notice.tsx](components/chrome/Notice.tsx)

Palette to expect in all shots: grid-black `#1A1614` ground, sabbe crimson `#9E2B2B` and
gold `#C79A3A` accents, lontar-leaf `#DBC7A0` text bands, and `daun` green `#2F5A44`
appearing *only* where the script does not decide something.
