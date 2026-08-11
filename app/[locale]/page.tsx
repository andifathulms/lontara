import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { fromCodepoint } from '@/lib/rules/inventory'
import { NotTranslatorNotice, ReviewerGateNotice } from '@/components/chrome/Notice'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'
/* The landing page opens with the aksara demonstration rather than with a
   title and lead, so it does not use `PageHeader` as the other five do. */
import { Page } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

/** The product. `baca` first — it is the flagship (PRD §3). */
const TOOLS = ['baca', 'tulis'] as const
/** Where you go second. */
const REFERENCE = ['aksara', 'ejaan'] as const
const CLASSES = ['final', 'gemination', 'prenasal', 'glottal'] as const

/**
 * The landing demonstration: one aksara string that three different Latin
 * words all write to.
 *
 * A site about a script had no character of that script above the fold. The
 * page argued the premise in prose and never showed it, when showing it takes
 * two glyphs and needs no language at all.
 *
 * These are not chosen here. `mata`, `matta` and `manta` are the fixtures
 * `prd.mata`, `prd.matta.gemination` and `prd.manta.final` in
 * tests/fixtures/writer.fixture.json, all three cited to PRD §2 and all three
 * asserted to produce exactly this pair. The three readings and the note below
 * them are `home.defective.example` / `exampleNote`, so the page cannot show
 * one word here and a different one in the section that explains it.
 *
 * Built through `fromCodepoint` rather than pasted as a literal, on the same
 * principle as lib/rendering/hardStrings.ts: the glyphs on screen and the
 * codepoints printed beneath them cannot drift apart.
 */
const HERO_CODEPOINTS = ['U+1A06', 'U+1A08'] as const
const HERO_AKSARA = HERO_CODEPOINTS.map(fromCodepoint).join('')

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)

  return (
    <Page>
      <section className="space-y-5">
        <h1 className="text-display text-lontar max-w-measure">
          {copy.home.headline}
        </h1>
        <p className="max-w-measure text-lead text-lontar/75">{copy.home.lead}</p>

        {/*
          The whole premise, without a sentence of it. Two glyphs, three words
          that all write to them.

          The aksara is aria-hidden and the codepoints carry it instead — a
          screen reader announces U+1A06 as whatever its fallback font makes of
          it, which is nothing. Same reasoning as the OG image's alt text in
          layout.tsx. The three readings below are real text and say the thing.

          The codepoint line is also invariant 10: this is the first aksara a
          visitor meets, and on the device where the font fails it is the only
          part of this figure that still carries the answer.
        */}
        <figure className="border-2 border-gold/30 bg-lontar/5 px-5 py-6 sm:px-8 sm:py-8">
          <figcaption className={eyebrow()}>{copy.home.heroLabel}</figcaption>
          <p
            aria-hidden="true"
            className="aksara mt-3 text-aksara text-lontar"
          >
            {HERO_AKSARA}
          </p>
          <p className="mt-2 font-anotasi text-anotasi text-lontar/65">
            {HERO_CODEPOINTS.join(' ')}
          </p>
          <p className="mt-4 text-lead text-lontar">{copy.home.defective.example}</p>
          <p className="mt-2 max-w-measure text-sm text-lontar/75">
            {copy.home.defective.exampleNote}
          </p>
        </figure>
      </section>

      {/*
        The two tools lead. This was four tiles of identical weight in one
        grid, which made a visitor read all four labels and work out for
        themselves which were the product and which were the appendix — and
        `baca` is the flagship (PRD §3), which the layout gave no sign of.

        Two rows now, each under its own label: the tools, then the reference
        pages you go to second.
      */}
      <nav className="space-y-8" aria-label={copy.siteName}>
        <div className="space-y-3">
          <h2 className={eyebrow()}>{copy.home.groupTools}</h2>
          <div className="grid gap-px bg-gold/30 md:grid-cols-2">
            {TOOLS.map((section) => (
              <Link
                key={section}
                href={href(locale, section)}
                className="group flex flex-col bg-grid px-5 py-7 no-underline hover:bg-gold/5"
              >
                <span className="flex items-baseline gap-2 text-section text-gold">
                  {copy.nav[section]}
                  {/* A card that looks like a card but gives no sign it is a
                      link is a dead end until you happen to hover it. */}
                  <span aria-hidden="true" className="text-lontar/65 group-hover:text-gold">
                    →
                  </span>
                </span>
                <span className="mt-2 block max-w-measure-tight text-lontar/75">
                  {copy.navDescription[section]}
                </span>
                {/*
                  The one marked next action, and it is on `tulis` rather than
                  on the flagship. `baca` is gated (PRD §9, invariant 12) and
                  carries the "not publicly released" line; sending a first
                  visitor there as the primary action lands them on a notice.
                  The writer works today. When the gate is met this belongs on
                  `baca`.
                */}
                {section === 'tulis' ? (
                  <span className="mt-4 self-start border-2 border-gold px-3 py-1.5 font-anotasi text-anotasi uppercase tracking-widest text-gold group-hover:bg-gold group-hover:text-grid">
                    {copy.home.cta}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className={eyebrow('quiet')}>{copy.home.groupReference}</h2>
          <div className="grid gap-px bg-gold/30 md:grid-cols-2">
            {REFERENCE.map((section) => (
              <Link
                key={section}
                href={href(locale, section)}
                className="group flex flex-col bg-grid px-5 py-4 no-underline hover:bg-gold/5"
              >
                <span className="flex items-baseline gap-2 text-gold">
                  {copy.nav[section]}
                  <span aria-hidden="true" className="text-lontar/65 group-hover:text-gold">
                    →
                  </span>
                </span>
                <span className="mt-1 block max-w-measure-tight text-sm text-lontar/75">
                  {copy.navDescription[section]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">{copy.home.defective.title}</h2>
        <p className="max-w-measure text-lontar/85">{copy.home.defective.body}</p>

        {/* The mata/matta/manta figure that stood here has moved into the hero.
            Showing it twice on one page would make the second one look like a
            different example that happens to read the same. */}
        <ul className="grid gap-3 sm:grid-cols-2">
          {CLASSES.map((cls) => (
            <li key={cls} className="flex gap-3">
              {/* daun = ambiguity, and nothing else. PRD §10. */}
              <Rhombus size={13} tone="daun" className="mt-1.5" />
              <span>
                <span className={eyebrow('daun')}>
                  {copy.ambiguityClass[cls]}
                </span>
                <span className="block text-sm text-lontar/75">
                  {copy.ambiguityClassBody[cls]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">{copy.home.asymmetry.title}</h2>
        <dl className="grid gap-px bg-gold/30 md:grid-cols-2">
          <div className="bg-grid px-5 py-4">
            <dt className={eyebrow()}>
              Latin → Lontara
            </dt>
            <dd className="mt-1 text-sm text-lontar/85">{copy.home.asymmetry.latinToLontara}</dd>
          </div>
          <div className="bg-grid px-5 py-4">
            <dt className={eyebrow()}>
              Lontara → Latin
            </dt>
            <dd className="mt-1 text-sm text-lontar/85">{copy.home.asymmetry.lontaraToLatin}</dd>
          </div>
        </dl>
        <p className={eyebrow('quiet')}>
          {copy.home.open}
        </p>
      </section>
    </Page>
  )
}
