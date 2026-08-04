# Aset merek / Brand assets

The mark is **sulapa' eppa'** — the four-cornered form Bugis letters are drawn
from — carrying the vowel dot the script itself so often leaves out. That is the
same figure the reading tree branches on and the same one in the header, and it
means the same thing in all three places (PRD §10).

Author: Andi Fathul Mukminin Salahuddin. Same author as the site; no third-party
licence applies.

## What is here, and why only this much

The full kit — vector masters, every size from 16 to 1024, horizontal and
vertical lockups, wordmarks, light and dark and transparent variants — is **not
in this repository**. It is gitignored at `exports/`.

Only what a browser or an installed app actually requests is vendored, because
`scripts/build-service-worker.mjs` precaches *everything* in the export. An
unused 1024px icon is not a spare copy, it is 50 KB every visitor downloads to
keep offline.

| File | Serves |
|---|---|
| `../favicon.svg` | The browser tab, everywhere that takes an SVG icon. 298 bytes. |
| `lontara-icon-32.png` | Favicon fallback where SVG is not taken. |
| `lontara-icon-180.png` | `apple-touch-icon` — iOS home screen. |
| `lontara-icon-192.png` | Web app manifest, the small install icon. |
| `lontara-icon-512.png` | Web app manifest, splash and store listings. |
| `lontara-icon-maskable-512.png` | Manifest `purpose: maskable` — Android crops icons to its own shape, and a non-maskable icon gets its corners cut off. |
| `../social/lontara-og-1200x630.png` | Open Graph and Twitter card. |

92 KB in total, all of it precached.

## Two rules from the kit that this app already follows

**Below 40px, use the solid form.** The outline is 5.5% of tile width and
disappears at small sizes. The header mark is 11px, so it renders as the solid
rhombus — which is exactly what `components/ambiguity/Rhombus.tsx` draws. The
header was already correct; nothing needed swapping.

**Red never appears in the mark.** In this app that is `sabbe`, and it belongs
to the "not a translator" warning alone. The kit's own cream tile puts a red dot
in the mark; that variant is therefore not used here.

## Where the kit's palette and this app's palette differ

They are close and they are not the same. The kit is a standalone artefact; PRD
§10 fixes the interface palette.

| | Kit | App (PRD §10) |
|---|---|---|
| Ground | `#15120C` near-black | `#1A1614` `grid` |
| Gold | `#C9992F` | `#C79A3A` `gold` |
| Cream | `#EAE0C6` | `#DBC7A0` `lontar` |
| Red | `#B3392F` | `#9E2B2B` `sabbe` |

This is deliberately left alone rather than reconciled. Kit hex appears **only
inside these standalone files**, which are never seen beside interface colour —
a tab icon, a home-screen tile, a link preview. Nothing rendered *in* the page
uses it: the header mark and everything else draw from the Tailwind tokens, so
the two golds never meet. If a lockup is ever placed inside a page, that stops
being true and the palettes have to be reconciled first.

`themeColor` stays `#1A1614`, the app's own ground, because it paints browser
chrome adjacent to the running app rather than to the icon.

## The wordmark is not used

The kit sets it in Source Serif 4 semibold. This app sets Latin in Gentium Plus,
chosen because the project needs `' ə ŋ ñ á` to render consistently (PRD §10),
and the header wordmark is live text rather than an image — it selects, scales,
recolours and translates. Shipping a third Latin face for one word in the header
is not worth it. The divergence is recorded here rather than resolved.
