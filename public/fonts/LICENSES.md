# Lisensi huruf / Font licences

Every face here is self-hosted. Nothing is loaded from a third-party CDN and
nothing falls back to a system font for aksara (invariant 17). Full licence
texts are vendored alongside their sources in [`vendor/fonts/`](../../vendor/fonts/).

---

## Noto Sans Buginese — aksara

The aksara face. Nothing else renders Lontara in this app.

| | |
|---|---|
| **Face** | Noto Sans Buginese Regular |
| **Version** | 2.002 |
| **Licence** | SIL Open Font License 1.1 (OFL-1.1) |
| **Copyright** | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/buginese) |
| **Licence text** | [`vendor/fonts/NotoSansBuginese-OFL.txt`](../../vendor/fonts/NotoSansBuginese-OFL.txt) |
| **Upstream source** | https://github.com/notofonts/notofonts.github.io — `fonts/NotoSansBuginese/hinted/ttf/NotoSansBuginese-Regular.ttf` |
| **Vendored original** | [`vendor/fonts/NotoSansBuginese-Regular.ttf`](../../vendor/fonts/NotoSansBuginese-Regular.ttf) |
| **Shipped file** | `noto-sans-buginese-subset.woff2` |
| **Regenerate with** | `pnpm fonts:subset` |

**Upstream face as vendored:** 41 glyphs, 39 cmap entries, `liga` (GSUB),
`abvm` / `dist` / `mark` (GPOS). The mark-positioning features are what place
the vowel signs; a subset that dropped them would render the signs detached.

**Subset coverage:** `U+1A00–1A1F` (the Buginese block in full — all 30
assigned code points), plus `U+0020`, `U+00A0`, and `U+25CC DOTTED CIRCLE`
(the script reference shows each vowel sign on a dotted circle so its
combining behaviour is visible).

`U+A9CF JAVANESE PANGRANGKEP` is mapped by the upstream face and is
**deliberately dropped** from the subset. Bugis only — invariant 14.

`font-display: block`. Tofu reads as a broken app, so no-text beats
wrong-text (PRD §13). The codepoint view (PRD §6.8) is the real fallback when
rendering fails.

---

## Gentium Plus — Latin body and display

Chosen functionally, not aesthetically: this project needs `' ə ŋ ñ á` and
related diacritics to render consistently, and Gentium was built for
linguistic typesetting (PRD §10).

| | |
|---|---|
| **Face** | Gentium Plus, weights 400 and 700 |
| **Licence** | SIL Open Font License 1.1 (OFL-1.1) |
| **Copyright** | Copyright (c) 2003-2022 SIL International |
| **Licence text** | [`vendor/fonts/GentiumPlus-OFL.txt`](../../vendor/fonts/GentiumPlus-OFL.txt) |
| **Source** | Fontsource `@fontsource/gentium-plus`, Latin subset |
| **Shipped files** | `gentium-plus-latin-400.woff2`, `gentium-plus-latin-700.woff2` |

---

## Space Mono — rule ids and codepoints

Rule ids and codepoints read as annotation rather than as content (PRD §10).

| | |
|---|---|
| **Face** | Space Mono Regular |
| **Licence** | SIL Open Font License 1.1 (OFL-1.1) |
| **Copyright** | Copyright 2016 The Space Mono Project Authors (https://github.com/googlefonts/spacemono) |
| **Licence text** | [`vendor/fonts/SpaceMono-OFL.txt`](../../vendor/fonts/SpaceMono-OFL.txt) |
| **Source** | Fontsource `@fontsource/space-mono`, Latin subset |
| **Shipped file** | `space-mono-latin-400.woff2` |

---

## On subsetting an OFL face

OFL-1.1 permits modification and redistribution, including subsetting.

The licence text travels with each font — vendored in `vendor/fonts/` and
linked above. None of the three copyright notices declares a Reserved Font
Name, so renaming is not obligatory here; the subset is nonetheless shipped as
`noto-sans-buginese-subset.woff2` and declared to CSS as the family
`Lontara Aksara`, so a modified face is never presented as the upstream one.
