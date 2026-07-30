# Sumber / Sources

Every rule in [`rules.json`](./rules.json) carries a citation, and
`pnpm rules:validate` fails the build if one does not (invariant 2). This file
is what those citations point at, and what is deliberately still missing.

## What is cited

### The encoding

- **The Unicode Standard, Buginese block U+1A00–U+1A1F.** 30 assigned code
  points since Unicode 4.1 (2005). Code chart:
  <https://www.unicode.org/charts/PDF/U1A00.pdf>
- **The Unicode Character Database.** General category and canonical combining
  class for the five vowel signs. Read with `unicodedata` and recorded in
  [`inventory.json`](./inventory.json): `U+1A17` is Mn ccc 230 (Above), `U+1A18`
  is Mn ccc 220 (Below), `U+1A19` and `U+1A1A` are Mc ccc 0, `U+1A1B` is Mn
  ccc 0.
- **Everson's encoding proposals** — L2/98-021, L2/99-011, L2/03-191,
  L2/03-320. Cited in `inventory.json` as design rationale. **Not yet read in
  full.** They are the most likely source to settle
  `openQuestions.prenasal-coverage`.

### The font

- **Noto Sans Buginese 2.002**, OFL-1.1. Version, glyph count, cmap coverage
  and OpenType feature list read from the vendored TTF, not from documentation.
  See [`public/fonts/LICENSES.md`](../../public/fonts/LICENSES.md).
  `pnpm rules:validate` checks every codepoint in `inventory.json` against that
  font's cmap.

### Attested practice

- **Bugis Wikipedia**, `{{multiscript|<lontara>|<latin>}}` in article namespace.
  97 unique community-authored pairs, extracted from the dated
  `bugwiki-20260701-pages-articles` dump (sha256 recorded in
  `data/corpus/bugwiki-pairs.json`), CC BY-SA 4.0. Regenerate with
  `pnpm corpus:pairs`.

  This is **community practice, not an authority**, and individual pairs are
  demonstrably wrong — `tests/corpus.test.ts` names each disagreement and why.
  But it is real evidence about Bugis Latin orthography, which is more than the
  Unicode character names ever were, and it is what rules v0.2.0 rests on where
  the two conflict. A reviewer still settles anything.

### In-repo

- **`PRD.md` §2** for the four ambiguity classes and the `mata` / `matta` /
  `manta` illustration. An in-repo citation is weaker than a published one and
  is marked as such: rules resting on it carry `status: "derived"`, and the
  derivation is written out in the citation field so it can be disputed whole.

## What is NOT cited, and therefore not implemented

The sources below are named in PRD Appendix A and are all freely available.
None has been extracted. Until they are, the gaps stay open rather than being
filled from general knowledge of Brahmic scripts — see `openQuestions` in
`rules.json`.

| Source | What it would settle |
|---|---|
| Said, *Kamus Bahasa Bugis-Indonesia* (1977), via oxis.org | The lexicon; `openQuestions.final-inventory`; the `w`/`v` question |
| *Kamus Bahasa Bugis-Indonesia* (227 pp.) and *Kamus Dwibahasa Bugis-Indonesia* (2017), Wikimedia Commons — check the licence tag on each file first | The lexicon, in bulk |
| A Bugis–English–Indonesian dictionary ordered by **Latin** alphabet | The lexicon, more cheaply than a Lontara-ordered source |
| Bugis Wikipedia (`bug.wikipedia.org`) | Frequency bands for ranking |
| Badan Pengembangan dan Pembinaan Bahasa | Whether the attested practice in `bugwiki-pairs.json` is the *standard* orthography — which is what `openQuestions.va-latin`, `openQuestions.vowel-sign-e-ae` and `openQuestions.glottal-q` now turn on |
| *Sureq Galigo*, *pappaseng* — short excerpts, edition and translator credited | Running-text fixtures |

## Changelog

Rule changes go through this log (PRD §9).

| Version | Change |
|---|---|
| 0.2.0 | Corrected from attested pairs (`data/corpus/bugwiki-pairs.json`, bug.wikipedia dump 20260701, CC BY-SA 4.0). **Latin `e` takes U+1A1B and `é` takes U+1A19** — the reverse of what the Unicode character names implied, and the old mapping meant the writer silently dropped every `é`. **U+1A13 takes the onset `w`**, not `v`; `v` is accepted on input only. **`q` accepted as the glottal stop.** Agreement with attested pairs went from 54/97 to 91/97. Two findings recorded and deliberately NOT acted on: `ngp` → MPA and `nc` → NYCA. |
| 0.1.0 | First rule set. Composition and prenasal-letter rules cited to the Unicode code chart and character names. Four loss rules derived from the absence of a virama, with the derivation stated. `latin.va.w` shipped as provisional. Six open questions recorded and not guessed at. No reviewer has seen any of it. |
