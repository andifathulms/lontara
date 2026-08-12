import type { Band as BandLayout } from '@/lib/engine/band'
import type { Span } from '@/lib/engine/trace'
import { getCopy } from '@/lib/i18n/copy'
import type { Locale } from '@/lib/i18n/locales'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'
import { ScrollRegion } from '@/components/chrome/ScrollRegion'

/**
 * The palm-leaf band (PRD §6.2): aksara on the lontar-leaf ground, the Latin
 * line beneath, connector strokes linking each Latin cluster to the glyph it
 * produced.
 *
 * No word spacing inside the aksara band — that is how the script works, and the
 * connector strokes carry segmentation instead (PRD §10).
 *
 * Discarded information is marked on the connector that dropped it, so loss is
 * visible at the point it happens rather than summarised in a footer. The
 * markers are `daun`, which means ambiguity here and nowhere else.
 *
 * ── On the layout ──────────────────────────────────────────────────────────
 * One grid, four rows, columns declared once. It used to be three independent
 * flex rows: the aksara sized to its glyphs, the connectors and the Latin line
 * to `flex-1`. Those two rules do not agree, so every connector after the
 * first pointed somewhere between two glyphs — the stroke that is supposed to
 * say "this Latin made that aksara" was quietly saying the wrong thing. A
 * shared grid makes the misalignment unrepresentable.
 *
 * The columns are sized to the aksara and nothing else. A loss marker is
 * centred out of a zero-width box so that a long label can never push the
 * glyphs apart — the band has to stay shoulder to shoulder, and what was
 * dropped is spelled out in full in the ambiguity panel beside it.
 */
export function Band({
  band,
  locale,
  activeSpan = null,
}: {
  band: BandLayout
  locale: Locale
  /**
   * The output span of whichever trace step is being pointed at, in the
   * *output* coordinate space. A `normalize` step indexes the normalised input
   * instead and must never be passed here — see `outputSpanIn` on TraceStep.
   */
  activeSpan?: Span | null
}) {
  const copy = getCopy(locale)

  if (band.columns.length === 0) {
    return <p className="text-sm text-lontar/65">{copy.writer.emptyState}</p>
  }

  /* A loss produces nothing, so its span is empty and collapses to the single
     column it hangs on. A width-zero span is not "no columns", it is "here". */
  const isActive = (index: number) => {
    if (!activeSpan) return false
    return activeSpan.end > activeSpan.start
      ? index >= activeSpan.start && index < activeSpan.end
      : index === activeSpan.start
  }

  const columns = band.columns
  /* A 1rem cell at each end so the leaf runs past the first and last glyph
     rather than being cropped flush to them. */
  const template = `1rem repeat(${columns.length}, max-content) 1rem`

  return (
    <figure className="space-y-0">
      <ScrollRegion labelledBy="band-caption">
        <div className="grid w-max" style={{ gridTemplateColumns: template }}>
          {/* Row 1 — the leaf. The end cells carry the ground too, so it is
              continuous behind the padding. */}
          <span className="bg-lontar" aria-hidden="true" />
          {columns.map((column) => (
            <span
              key={`aksara-${column.index}`}
              /*
               * Hidden from assistive technology, on the same reasoning as the
               * landing hero: a screen reader announces a Buginese code point
               * as whatever its fallback font makes of it, which is nothing
               * useful. Reading the band aloud produced a string of nothings
               * between the Latin cells that do carry the answer.
               *
               * Nothing is lost by hiding it. The Latin row below is real text,
               * the figcaption names what the band is, the loss markers carry
               * their class in an sr-only span, and the codepoint list — always
               * present, invariant 10 — states every one of these glyphs by
               * name a few sections down.
               */
              aria-hidden="true"
              /* The highlight is a block of gold on the leaf, not a glow or a
                 rounded pill — the same hard-edged vocabulary as the rest. */
              className={`aksara py-4 text-center text-aksara-band text-grid ${
                isActive(column.index) ? 'bg-gold' : 'bg-lontar'
              }`}
            >
              {/* An empty trailing column still has to occupy the band, or the
                  connector below it would point at nothing. */}
              {column.aksara === '' ? ' ' : column.aksara}
            </span>
          ))}
          <span className="bg-lontar" aria-hidden="true" />

          {/* Row 2 — connectors. They draw in briefly, in the direction of
              writing. This is one of the only two things that move (PRD §10). */}
          <span />
          {columns.map((column, order) => (
            <span key={`stroke-${column.index}`} className="flex justify-center">
              <span
                className={`block w-px ${
                  column.losses.length > 0 ? 'bg-daun-ink' : 'bg-gold/60'
                }`}
                style={{
                  height: '1.75rem',
                  transformOrigin: 'top',
                  animation: 'lontara-stroke 220ms ease-out both',
                  animationDelay: `${order * 45}ms`,
                }}
                aria-hidden="true"
              />
            </span>
          ))}
          <span />

          {/* Row 3 — the Latin line. */}
          <span />
          {columns.map((column) => (
            <span
              key={`latin-${column.index}`}
              className={`text-center font-anotasi text-anotasi ${
                isActive(column.index) ? 'text-gold' : 'text-lontar/85'
              }`}
            >
              {column.latin}
            </span>
          ))}
          <span />

          {/* Row 4 — what was dropped, under the connector that dropped it.
              Zero-width and centred, so a marker never widens its column. */}
          <span />
          {columns.map((column) => (
            <span key={`loss-${column.index}`} className="relative">
              {column.losses.length > 0 ? (
                <span className="absolute left-1/2 top-1 flex -translate-x-1/2 flex-col items-center gap-1">
                  {column.losses.map((loss) => (
                    <span
                      key={`${loss.ruleId}-${loss.latin}`}
                      className="flex items-center gap-1 whitespace-nowrap"
                      title={`${loss.ruleId} — ${copy.ambiguityClass[loss.ambiguityClass]}`}
                    >
                      <Rhombus size={9} tone="daun" />
                      <span className="font-anotasi text-anotasi text-daun-ink">
                        <span className="line-through">{loss.latin}</span>
                        <span className="sr-only">
                          {' '}
                          {copy.ambiguityClass[loss.ambiguityClass]}
                        </span>
                      </span>
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
          ))}
          <span />
        </div>
      </ScrollRegion>

      {/* Reserves the height the absolutely-positioned markers take out of flow. */}
      {band.hasLoss ? (
        <div className="h-6" aria-hidden="true" />
      ) : null}

      <figcaption
        id="band-caption"
        className="mt-3 max-w-measure font-anotasi text-anotasi text-lontar/65"
      >
        {locale === 'id'
          ? 'Aksara tidak memakai spasi antarkata. Garis penghubung yang menandai batasnya.'
          : 'The script uses no word spacing. The connector strokes mark the boundaries instead.'}
        {band.hasLoss ? (
          <>
            {' '}
            <span className={eyebrow('daun', 'sm')}>
              {locale === 'id'
                ? 'Berlian menandai yang dibuang.'
                : 'A rhombus marks what was dropped.'}
            </span>
          </>
        ) : null}
      </figcaption>
    </figure>
  )
}
