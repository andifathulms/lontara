# CLAUDE.md — Lontara

Lontara reading and writing explainer for **Bugis (Basa Ugi) only**. Enumerates the readings the script leaves undetermined, and explains every choice by rule. Static site, GitHub Pages, no backend.

Read `PRD.md` before starting any task. It fixes scope; this file describes how to work in the repo.

**Three things shape everything here:**

1. **Lontara is a defective script.** No virama exists in the encoding. Final consonants, gemination, prenasalisation, and the glottal stop are simply not written. Latin→Lontara loses information; Lontara→Latin is one-to-many. Any code that assumes a bijection is wrong.
2. **Correct output is not always a function of the input.** The engine computes what it can and *declares* what it can't. Never guess quietly.
3. **This is a living script with a community of practice.** Wrong output has real consequences. When unsure about an orthographic rule, stop and ask. Do not infer Bugis orthography from general knowledge of Brahmic scripts and commit it as fact.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Zod for rule-set and lexicon schema validation
- Vitest
- pnpm
- No transliteration library. The rule interpreter is the project.

## Commands

```bash
pnpm dev
pnpm build                # static export to ./out; runs rules:validate first
pnpm preview              # serve ./out under the production basePath
pnpm test                 # vitest watch
pnpm test:run             # vitest once — before every commit
pnpm test:enumerate       # enumeration-completeness properties
pnpm rules:validate       # schema, citations, priority conflicts, ambiguity classes
pnpm rules:report         # every rule with citation and reviewer status
pnpm lexicon:validate     # per-entry provenance and schema
pnpm fonts:subset         # regenerate the Noto Sans Buginese subset
pnpm render:conformance   # build the rendering conformance page
pnpm typecheck
pnpm lint
```

`pnpm rules:validate` and `pnpm lexicon:validate` are wired into `build` and CI and may fail the deploy. Do not weaken them.

## Layout

```
app/
  [locale]/               # id (default), en
    baca/                 # reader — Lontara → Latin, the flagship
    tulis/                # writer — Latin → Lontara
    aksara/               # script reference
    ejaan/                # orthography disclosure
components/
  tree/                   # reading tree; rhombus ambiguity nodes
  band/                   # palm-leaf band + connector strokes
  trace/                  # rule trace panel
  ambiguity/              # markers and panel
  keyboard/               # on-screen Lontara keyboard, ka-ga-nga order
lib/
  engine/                 # THE CORE. Pure. No React, no DOM, no clock.
    normalize.ts          # NFC, Latin orthography variant handling
    segment.ts            # grapheme clusters, CV syllable structure
    interpret.ts          # defaulting traversal (writer)
    enumerate.ts          # ambiguity-expanding traversal (reader)
    trace.ts              # TransliterationTrace, spans, Ambiguity
    rank.ts               # lexicon scoring for reading candidates
  rules/                  # schema, loader, validator
  lexicon/                # loader, frequency bands
data/
  rules/                  # rules.json, inventory.json, sources.md, reviewers.md
  lexicon/                # entries + provenance
public/fonts/             # subset Noto Sans Buginese + LICENSES.md
tests/
  fixtures/               # dictionary/textbook-sourced, cited per case
  reviewed/               # reviewer-approved — see invariant 11
  enumerate/
  rendering/              # conformance reference images
```

## Invariants

1. **No orthographic rule is written in application code.** Rules live in `data/rules/rules.json` with an id, citation, priority, and ambiguity class where applicable. The engine is an interpreter. This exists so a Bugis-literate reviewer who does not code can audit the orthography.

2. **Every rule carries a citation.** Validator-enforced. If you cannot cite it, you do not know it well enough to add it — say so rather than adding it.

3. **Ambiguity is never silently resolved.** Emit `Ambiguity { class, candidates, chosen, reason, spans }`. Ambiguity classes are a closed set: `final`, `gemination`, `prenasal`, `glottal`. Adding a class is a deliberate schema change. `chosen` without `reason` is a bug.

4. **Never assume a bijection between Latin and Lontara.** Latin→Lontara is lossy by design. Do not write code, tests, or types that presume exact round-trip. The correct property is enumeration completeness (invariant 15).

5. **The engine is pure.** `(input, direction, options, ruleSet, lexicon) => TransliterationTrace`. No imports from `react`, `next`, `components/`; no browser globals; no module-level mutable state; no clock.

6. **Every trace step has input and output spans.** All highlighting, linking, and loss-marking is span-based. A step without spans is unfinished.

7. **Never index strings by code unit for glyph logic.** Normalize to NFC; iterate grapheme clusters with `Intl.Segmenter`. `str[i]`, `.split('')`, and `.length`-as-glyph-count are bugs in this codebase.

8. **One rule set, two traversals.** `interpret.ts` defaults; `enumerate.ts` expands. Never fork rule data per direction.

9. **Nothing is computed in a component.** Components render a `TransliterationTrace` or a reading tree.

10. **Codepoint view is always available.** Rendering will fail on some device; codepoints are the fallback that still carries the answer.

11. **Files in `tests/reviewed/` may not be modified.** They carry a named reviewer's sign-off. If the engine disagrees, the engine is wrong. Changing a reviewed fixture requires going back to that reviewer — a human task. Flag it and stop.

12. **Do not launch a feature past a reviewer gate.** `data/rules/reviewers.md` must name at least one Bugis reviewer before the reader ships. Do not bypass or remove this gate.

13. **Every lexicon entry has a provenance field.** No entry without a source. Anything with unclear licensing does not go in, however convenient.

14. **Bugis only.** Do not add Makassarese, Mandar, Javanese, Balinese, or the Makasar script. If asked to, confirm the scope change explicitly first — Makassarese and Mandar are the legitimate first expansion, but not silently.

15. **Enumeration completeness is the core property.** For every Latin fixture: transliterate to Lontara, enumerate back, assert the original appears in the reading set. This is the test that matters most in the repo.

16. **Transliteration is not translation.** Never produce, imply, or label meaning. The UI must never suggest the tool translates.

17. **Font is self-hosted, subset, licence-recorded.** `public/fonts/LICENSES.md` names the face, licence (OFL-1.1), and source. Never rely on a system font for aksara.

## Working style

- **Rendering first.** Before implementing any rule, confirm its output renders correctly in the bundled font on real devices. A correct codepoint sequence that renders as garbage is not done.
- **Fixture before rule.** Transcribe the dictionary or textbook example, cite it, then implement until it passes.
- **When you don't know the orthography, say so.** Do not fill a gap from general Brahmic knowledge and present it as researched. Mark it unverified or leave it out and flag it. Confident wrongness is the specific failure this project must avoid.
- **Surface ambiguity rather than choosing.** If you are picking between two defensible outputs, that is an `Ambiguity`, not your decision.
- **Loss is marked where it happens.** When the writer discards information, the trace names the class at that span — not in a summary at the end.
- **Small increments.** One direction, end to end.
- **Don't touch `next.config.js`, the Actions workflow, the validators, or `public/fonts/` without saying so explicitly.**
- **Don't add dependencies for Unicode normalization or segmentation.** `String.prototype.normalize` and `Intl.Segmenter` are built in.
- **Never weaken a test or validator to make something pass.**

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for trace steps, ambiguities, and results, keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in engine code.
- Rule ids stable and readable: `lontara.final.drop`, `lontara.gemination.collapse`, `latin.glottal.apostrophe`, `lontara.vowel.i`.
- Bugis terminology in code, comments, and UI. Do not substitute English approximations.
- Codepoints in comments as `U+1A00` with the Unicode name.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `grid` (`#1A1614`), `sabbe` (`#9E2B2B`), `gold` (`#C79A3A`), `daun` (`#2F5A44`), `lontar` (`#DBC7A0`). Never raw hex in components. **`daun` is reserved for ambiguity markers and nothing else.** See PRD §10.
- Ambiguity nodes in the reading tree render as rhombi — the *sulapa' eppa'* four-cornered form. This is a meaning-carrying choice, not decoration; don't replace it with a generic node shape.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:enumerate` before any engine commit.
- New rule → a cited fixture, plus an ambiguity assertion if it can conflict with another rule.
- New lossy class → a fixture proving the trace names the class at the right span.
- Never assert exact Latin→Lontara→Latin round-trip. Assert set membership.
- Font or version bump → re-run rendering conformance and review the image diffs by eye. Never accept them blind.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions; rule and lexicon validation gate it. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. `font-display: block` for the aksara face — tofu reads as a broken app, so no-text beats wrong-text. Verify with `pnpm preview` before pushing.

## Framing

The site states plainly that it is a personal project, not an authority, and can be wrong. Reviewers credited by name with consent. Nulisa linked as the better tool for Javanese and Balinese — accurate, generous, deliberate. Sureq Galigo and pappaseng excerpts short, with edition and translator credited. No OIKN or government branding anywhere.

## Current state

Past M0. Every planned route exists and works against a real, if lexicon-thin, engine: `/`, `/baca` (reader), `/tulis` (writer), `/aksara` (script reference, plus `/aksara/serupa` and `/aksara/konformansi`), and `/ejaan` (orthography disclosure), in both `id` and `en`. The static export builds and deploys, the Noto Sans Buginese subset is licence-recorded, and `rules:validate` / `lexicon:validate` gate the build as designed.

**M3 has not shipped publicly.** `data/rules/reviewers.md` names no Bugis reviewer yet, so `ReviewerGateNotice` renders on every route and the reader stays gated per invariant 12 — nothing about the code being further along changes that.

**Long-lead item: the Bugis reviewer search is still open.** It gates the launch and it is the one thing that cannot be hurried.
