import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { fromCodepoint } from '@/lib/rules/inventory'
import { NotTranslatorNotice, ReviewerGateNotice } from '@/components/chrome/Notice'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Page, PageHeader } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

const SECTIONS = ['baca', 'tulis', 'aksara', 'ejaan'] as const
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

      {/* The two tools lead. `baca` is the flagship (PRD §3) and was one of
          four equal tiles; the reference pages are where you go second. */}
      <nav className="grid gap-px bg-gold/30 md:grid-cols-2" aria-label={copy.siteName}>
        {SECTIONS.map((section) => (
          <Link
            key={section}
            href={href(locale, section)}
            className="group flex flex-col bg-grid px-5 py-6 no-underline hover:bg-gold/5"
          >
            <span className="flex items-baseline gap-2 text-xl text-gold">
              {copy.nav[section]}
              {/* A card that looks like a card but gives no sign it is a link
                  is a dead end until you happen to hover it. */}
              <span aria-hidden="true" className="text-lontar/65 group-hover:text-gold">
                →
              </span>
            </span>
            <span className="mt-1 block max-w-measure-tight text-sm text-lontar/75">
              {copy.navDescription[section]}
            </span>
          </Link>
        ))}
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
