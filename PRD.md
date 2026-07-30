# PRD — Lontara

**A Lontara reading and writing explainer for Bugis. Enumerates what the script cannot tell you, and explains every choice it makes.**

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, cultural utility |
| **Deployment** | GitHub Pages (static export, no server) |
| **Scope** | **Bugis (Basa Ugi) only.** Not Makassarese, not Mandar, not Javanese, not Balinese. |
| **Language** | Indonesian-first UI, Bugis terminology throughout, English secondary |

**On the name.** "Lontara" is the script's own name, chosen deliberately for immediate recognition by the intended audience. The tradeoff is accepted knowingly: search discoverability will be poor, because the term is dominated by encyclopedia entries, font downloads, and cultural articles, and `lontar.eu` already occupies adjacent namespace. Alternatives considered and rejected: **Urupu** (Bugis for "letters", from the endonym *Urupu Sulapa' Eppa'*, "four-cornered letters") and **Sulapa** (the four-cornered form). If discoverability later proves to be a real constraint, **Urupu** is the fallback — it is the endonym, it is short, and it is unclaimed.

---

## 1. Scope decision

Originally specced as a three-script tool. Cut to Bugis only, for four reasons that all point the same way:

1. **Lontara has almost no shaping.** Noto Sans Buginese ships 41 glyphs and 2 OpenType features. Javanese and Balinese need stacked pasangan and gantungan and dozens of features. The rendering gate that would have been the project's biggest risk is nearly free here.
2. **One reviewer instead of three.** The cultural-review requirement (§9) is the real bottleneck on a project like this. One script means one person to find.
3. **Lontara is where the competition isn't.** Nulisa is strong on Javanese and has covered it since 2012. Bugis is comparatively underserved, and nobody has built the reading enumerator at all.
4. **The interesting property is Bugis-specific.** The defectiveness of the script (§2) is what makes this project novel. Javanese and Balinese don't have it.

Makassarese and Mandar also use Lontara, and the Makasar script is a **different** script with a different Unicode block. Getting these distinctions right in the UI matters, because confusing them is exactly the error this project should be correcting rather than committing.

## 2. The core property

Lontara is a **defective** abugida. The Unicode Buginese block (U+1A00–U+1A1F, 30 assigned points since Unicode 4.1) contains 23 consonants, five vowel signs, and two punctuation marks — **and no virama**. There is no mechanism in the encoding for a bare consonant.

Consequently the orthography does not write:

- syllable-final consonants
- geminate consonants
- prenasalisation
- the glottal stop

So `mata`, `matta`, and `manta` are written identically. Readers recover the intended word from vocabulary and context.

| Direction | Property |
|---|---|
| **Latin → Lontara** | Deterministic but **lossy**. The discarded information is predictable and enumerable. |
| **Lontara → Latin** | **One-to-many.** A string has many valid readings; choosing requires lexical and contextual knowledge. |

**This asymmetry is the product.** Not the conversion — the enumeration.

## 3. What this is

Two tools sharing one rule set and one trace structure.

**The reader (flagship).** Paste or type Lontara. Get the set of plausible Latin readings as a tree: each branch labelled with its ambiguity class, complete readings ranked against a Bugis lexicon, filterable to known words only. The user sees precisely what the script leaves undetermined.

**The writer.** Type Bugis Latin. Get Lontara, plus an explicit statement of what was discarded and where — because a user writing a name on a sign needs to know their Latin distinctions are about to vanish.

Both render the same `TransliterationTrace`. Both explain every step by rule, with a citation.

## 4. Non-goals

- **Not a translator.** Script conversion only, never meaning. Must be unmissable in the UI; existing sites blur this and users arrive confused.
- **Not Javanese or Balinese.** Nulisa is good and covers them. Link to it warmly.
- **Not Makassarese or Mandar in v1.** They use Lontara but have different phonologies and different Latin conventions. Adding them is a v2 rule-set addition, not a v1 hedge.
- **Not the Makasar script** (*ukiri' jangang-jangang*), which is separate, differently encoded, and out of scope.
- **No stroke-order animation.** No open ordered-stroke data exists, and authoring it correctly requires calligraphic training. Separate project, with experts.
- **No OCR, no manuscript imaging, no AR.** Needs models, can't be static.
- **No ML.** Lexicon is curated data; ranking is frequency plus rule-based scoring, fully inspectable.
- **No accounts, no server.** Static, offline-capable, shareable by URL hash.

## 5. Users

| | |
|---|---|
| **The Bugis reader** | Working with family documents, manuscripts, signage, or *pappaseng*. Needs the candidate readings, not one confident guess. Primary user, and the reason the reader ships before the writer. |
| **The learner** | Wants to read and write Basa Ugi. Currently gets black-box converters that substitute for the knowledge instead of building it. |
| **The philology / linguistics student** | Needs correct diacritics, codepoints, a stated orthographic basis, and honest ambiguity. Underserved by every consumer tool. |
| **The designer or signmaker** | Needs one short correct string, and needs to know when it's ambiguous — a wrong name on a permanent sign is a real failure. |

## 6. Features

### 6.1 The reading tree — flagship
Lontara input at the top. Below it, a branching tree of readings. Each branch node is an ambiguity point, labelled with its class:

- `final` — an unwritten syllable-final consonant
- `gemination` — single vs doubled consonant
- `prenasal` — unwritten prenasalisation
- `glottal` — unwritten glottal stop

Leaf nodes are complete readings, ranked by lexicon match and frequency band. Default view filters to readings that are known words; the unfiltered set is one toggle away, with the count shown so the user knows what's hidden. Combinatorial blow-up handled by a depth cap that is **reported**, never silently applied.

### 6.2 The band
The writer's primary output: a horizontal palm-leaf band holding the aksara, the Latin line beneath, and connector strokes linking each Latin cluster to the glyph it produced. Discarded information is marked on the connector that dropped it — so loss is visible at the point it happens, not summarised in a footer.

### 6.3 Rule trace
The ordered list of applied rules with input span, output span, rule id, and citation. The band, the tree, the explanations, and the ambiguity markers are all renderings of this one structure.

### 6.4 Lexicon
Curated Bugis wordlist as static JSON: headword, Latin orthography, frequency band, gloss, per-entry source. Deliberately modest and honest about coverage — 2,000 well-sourced entries beat 50,000 of unknown provenance, because the ranking is only as trustworthy as the lexicon behind it. See Appendix A.

### 6.5 Virtual keyboard
There is no system Lontara keyboard on most devices. An on-screen keyboard laid out in traditional *ka-ga-nga* order, with vowel signs as modifiers. Cheap to build, immediately useful, and it removes the main practical barrier to anyone using the reader at all.

### 6.6 Script reference
The full inventory with Bugis names, codepoints, and combining behaviour per mark. Useful independently of the tools, and the page most likely to attract inbound links.

### 6.7 Orthography disclosure
A page stating exactly which Bugis Latin orthography the app implements, with citations, and where practice diverges. **The Latin side needs as much specification as the Lontara side** — Bugis Latin has to encode final consonants, gemination, prenasalisation, and the glottal stop (the apostrophe in *Lontara'*), and these are precisely the distinctions the ambiguity classes are defined against. An underspecified Latin orthography makes the whole enumeration unsound.

### 6.8 Codepoint view
Always available. When rendering fails on someone's device, the codepoints still carry the answer.

## 7. Architecture

Static Next.js 14 App Router export. No backend, no runtime fetches.

```
input + direction + options
  → normalize    → NFC, orthography variant resolution
  → segment      → grapheme clusters, CV syllable structure
  → interpret    → defaulting traversal   → TransliterationTrace
  → enumerate    → expanding traversal    → reading tree
  → rank         → lexicon scoring
```

**Rules are declarative data, not code.** JSON in `data/rules/`, each rule carrying id, pattern, output, priority, citation, and ambiguity class where applicable. The engine is a small interpreter. This exists so a Bugis-literate reviewer who does not code can audit the orthography — which is the entire point of §9.

**The engine is pure.** `(input, direction, options, ruleSet, lexicon) => TransliterationTrace`. No React, no DOM, no globals, no clock.

**One rule set, two traversals.** `interpret` defaults and discloses; `enumerate` expands. Never fork the rule data per direction — if the two directions need different rules, the rule model is wrong.

**Ambiguity is a first-class type**, not a warning string: `{ class, candidates, chosen, reason, spans }`. A `chosen` without a `reason` is a bug.

**Spans on every step.** All highlighting and linking is span-based.

**Unicode discipline.** Normalize to NFC. Iterate grapheme clusters with `Intl.Segmenter`. Never index by code unit for glyph logic — the single most common defect in aksara tooling.

## 8. Testing

**Enumeration completeness.** For every Latin fixture: transliterate to Lontara, enumerate back, and assert the original Latin appears in the reading set. This is the correct property for a defective script — exact round-trip is not achievable and asserting it would be wrong.

**Lossy-class coverage.** Every documented lossy class has a fixture demonstrating it, and the trace must name the class at the point of loss.

**Textbook and dictionary fixtures.** Example words and sentences from the sources in Appendix A, transcribed with the source recorded per case.

**Reviewer-approved fixtures** in `tests/reviewed/`. Highest authority in the repo. If the engine disagrees with one, the engine is wrong. Modifying one requires going back to the reviewer.

**Rule-set integrity at build time.** Every rule has an id and a citation. No two equal-priority rules match the same input. Every ambiguity class is declared in the schema. Build fails otherwise.

**Rendering conformance.** Reference images for the hard-string set, checked on iOS Safari, Android Chrome, and desktop. Re-checked on any font bump, reviewed by eye.

## 9. Cultural responsibility

Lontara is a living script with a community of practice and a major literary tradition. Confidently wrong output has consequences: a mis-rendered name on a permanent sign, a student taught a wrong rule, a manuscript passage misread.

**Requirements, not aspirations:**

- **At least one named Bugis reviewer before launch.** Ideally someone who reads manuscript Lontara, not only someone who can type it — the reader is aimed at exactly that skill. Places to look: the Bugis Wikipedia community, the Sastra Daerah programme at Universitas Hasanuddin, and the Badan Bahasa provincial office in South Sulawesi.
- **No reviewer, no launch.** This gates M3.
- Reviewers credited by name, with consent, prominently.
- The site states plainly that it is a personal project, not an authority, and can be wrong.
- Rule sources cited in-repo; rule changes go through a changelog.
- Sureq Galigo and *pappaseng* material used as fixtures only in short excerpts, with edition and translator credited. The manuscripts are old; modern transcriptions and editions are someone's scholarly labour and are treated as such.

## 10. Design direction

The material world is specifically Bugis, and richer than a generic Nusantara palette allows.

**Motif: Sulapa' Eppa'.** The script's endonym is *Urupu Sulapa' Eppa'*, "four-cornered letters", and the four-cornered rhombus is a core Bugis cosmological form. It becomes the structural unit of the interface — and, precisely, **the ambiguity node in the reading tree is a rhombus**, because a branch point is a place where the reading has corners. The motif carries meaning rather than decorating.

**Palette: lipa' sabbe.** Bugis silk sarong, with its bold checked grids on dark ground. Not palm-leaf beige, not the default cream. Grid-black `#1A1614` as ground. Sabbe crimson `#9E2B2B` and gold `#C79A3A` as the two structural accents. Deep green `#2F5A44` reserved exclusively for ambiguity markers, so green always means "the script does not decide this". Lontar leaf `#DBC7A0` for the text bands the aksara sits on. Five values, hard grid lines, no gradients.

**Type.** Aksara comes from Noto Sans Buginese and nothing competes with it. Latin body and display in **Gentium Plus**, chosen functionally: this project needs `' ə ŋ ñ á` and related diacritics to render consistently, and Gentium was built for linguistic typesetting. Rule ids and codepoints in **Space Mono**, reading as annotation rather than content.

**Structure.** Horizontal bands with generous line height. No word spacing inside the aksara band — that is how the script works, and the connector strokes carry segmentation instead. Checked rules borrowed from the sarong grid, used for real structural division rather than ornament.

**Motion.** Connector strokes draw in briefly, in the direction of writing. Reading-tree branches expand from the rhombus. Nothing else.

**Copy.** Indonesian first, Bugis terminology always. Ambiguity stated plainly and without apology: *"Aksara Lontara tidak menuliskan konsonan akhir. Ada 6 kemungkinan bacaan."*

## 11. Milestones

| | | |
|---|---|---|
| **M0** | Rendering + scaffold | Static export deploying, Noto Sans Buginese subset and licence-recorded, rendering conformance green on iOS/Android/desktop. Cheap for this script — but still the first thing done. |
| **M1** | Engine | Rule schema and validator, segmenter, interpreter, trace, ambiguity type. Debug output only. |
| **M2** | Writer | Latin → Lontara, every lossy class declared and traced. Keyboard. |
| **M3** | Reader | Lontara → Latin enumerator, lexicon, ranking, reading tree. **Reviewer sign-off required. Ship publicly here.** |
| **M4** | Explanation UI | The band, connector strokes, rule trace panel, ambiguity panel. |
| **M5** | Reference | Script reference, orthography disclosure, glossary, offline polish. |

Five milestones instead of eight, and M3 is a complete, novel, useful product on its own.

## 12. Success criteria

- Original Latin appears in the enumerated reading set for 100% of fixtures.
- Every shipped rule has an id and a citation, enforced by the build.
- A named Bugis reviewer has signed off on the fixture set.
- Rendering conformance passes on iOS Safari, Android Chrome, and desktop Chrome/Firefox/Safari.
- Every output traceable to its rule in one tap.
- Fully offline after first load. JS ≤ 200 KB gzipped; font subset.
- Someone can type Bugis in Lontara on a phone with no system keyboard.

## 13. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Font self-hosted with `font-display: block` — tofu reads as a broken app, so no-text beats wrong-text. Rule validation gates the deploy. Verify under the production `basePath` with `pnpm preview` before pushing.

## 14. Risks

| Risk | Mitigation |
|---|---|
| **No reviewer can be found.** | Then M3 does not launch. Start looking during M1, not M3 — this is the long-lead item and it is a human task, not a technical one. |
| **Lexicon extraction is slower than expected.** | It will be. Sources are PDFs (Appendix A). Ship M3 with a small, honestly-labelled lexicon and grow it; the enumerator works without ranking, just less usefully. |
| **Confidently wrong output damages someone.** | Ambiguity never silently resolved. Reviewer gate. Explicit non-authority statement. Codepoint view always available. |
| **Latin orthography underspecified, making enumeration unsound.** | §6.7 is a blocking deliverable for M2, not documentation to write later. |
| **Reading enumeration blows up combinatorially.** | Depth cap, lexicon filtering by default, cap reported rather than truncating silently. |
| **Name is undiscoverable.** | Accepted knowingly. **Urupu** is the documented fallback. Revisit only if search traffic proves to be the binding constraint. |
| **Scope creep back to three scripts.** | §4 is binding. Makassarese and Mandar are the *first* legitimate expansion, not Javanese — they share the script. |

---

## Appendix A — Data sources

Everything needed is freely available. Nothing is machine-readable. Budget real time for extraction and verification, and record provenance per entry.

**Script and encoding**
- Unicode Buginese block U+1A00–U+1A1F, 30 assigned code points, Unicode 4.1 (2005). Official code chart PDF from unicode.org. Everson's encoding proposals (L2/98-021, L2/99-011, L2/03-191, L2/03-320) document the design rationale and are worth reading before writing rules.

**Font**
- **Noto Sans Buginese** — 41 glyphs, 2 OpenType features, 39 characters covered, OFL-1.1. Available from Google Fonts and Fontsource for self-hosting. Record the licence in `public/fonts/LICENSES.md`.
- `lontar.eu` (the Aksara Nusantara project) reports the stock Noto fonts are broadly functional for Lontara but have rendering issues in some situations, and ships an enhanced derivative. Test their hard cases specifically during M0.

**Lexicon and dictionaries** — all PDFs requiring extraction
- **oxis.org** hosts Said's 1977 *Kamus Bahasa Bugis-Indonesia* as a downloadable PDF. A serious South Sulawesi studies resource; work through it properly.
- **Wikimedia Commons**: *Kamus Bahasa Bugis-Indonesia* (227 pages) and *Kamus Dwibahasa Bugis-Indonesia* (2017). Check the licence tag on each file before using.
- A **Bugis–English–Indonesian dictionary ordered by Latin alphabet** rather than Lontara order exists — significantly easier to extract into a lexicon than a Lontara-ordered source. Prefer it for bulk work.
- **Bugis Wikipedia** (`bug.wikipedia.org`) as a frequency corpus. Small, but it is running text in a known licence.

**Language metadata**
- ISO 639-3 `bug`. Roughly 4 million speakers. Regulated by Badan Pengembangan dan Pembinaan Bahasa, which is also the place to ask about the standard Latin orthography.

**Text corpus for fixtures**
- *Sureq Galigo* — the Bugis epic, in Lontara. Short excerpts only, edition and translator credited.
- *Pappaseng* — ancestral counsel literature. Same treatment.
- Example sentences from the dictionaries above, cited per case.
