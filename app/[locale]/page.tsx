import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { pageMetadata } from '@/lib/metadata'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { INVENTORY, fromCodepoint } from '@/lib/rules/inventory'
import { interpret } from '@/lib/engine/interpret'
import { NotTranslatorNotice, ReviewerGateNotice } from '@/components/chrome/Notice'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'
/* The landing page opens with the aksara demonstration rather than with a
   title and lead, so it does not use `PageHeader` as the other five do. */
import { Page } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  // No `title`: the home page IS the site, so it keeps the full site title.
  return pageMetadata({ locale, description: getCopy(locale).tagline })
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
 * asserted to produce exactly this pair. HERO_ROWS below re-checks that at
 * build time and refuses to render if it ever stops being true, so the page
 * cannot outlive the fixture it illustrates.
 *
 * Built through `fromCodepoint` rather than pasted as a literal, on the same
 * principle as lib/rendering/hardStrings.ts: the glyphs on screen and the
 * codepoints printed beneath them cannot drift apart.
 */
const HERO_CODEPOINTS = ['U+1A06', 'U+1A08'] as const
const HERO_AKSARA = HERO_CODEPOINTS.map(fromCodepoint).join('')

/**
 * The two letters, each with the syllable it spells.
 *
 * This is the step the page used to skip. It showed ᨆᨈ beside `mata · matta ·
 * manta` and asked the reader to accept a relation between them — but nothing
 * said ᨆ is `ma`, and the codepoints underneath say so only to someone who
 * already has the inventory memorised. A newcomer met the thesis stated in
 * terms they had no way to decode.
 *
 * The Latin is derived, not written here: onset + the inherent vowel, both out
 * of inventory.json. If the inventory ever disagreed with this page, this page
 * would change.
 */
const HERO_LETTERS = HERO_CODEPOINTS.map((codepoint) => {
  const letter = INVENTORY.consonants.find((c) => c.codepoint === codepoint)
  if (!letter) throw new Error(`hero: ${codepoint} is not a consonant in the inventory`)
  return {
    codepoint,
    aksara: fromCodepoint(codepoint),
    latin: `${letter.onset}${INVENTORY.inherentVowel.latin}`,
    unicodeName: letter.unicodeName,
  }
})

/**
 * The three words, each run through the shipped writer at build time.
 *
 * Every one of them produces HERO_AKSARA, and showing that column three times
 * over is the demonstration: the identity is on screen at once rather than
 * being something the reader has to establish by pressing three example chips
 * in turn and noticing that nothing changed.
 *
 * What vanished comes from the trace's own ambiguities, so the page cannot
 * claim a loss the engine did not declare.
 */
const HERO_ROWS = ['mata', 'matta', 'manta'].map((latin) => {
  const trace = interpret(latin)
  if (trace.output.text !== HERO_AKSARA) {
    throw new Error(`hero: ${latin} no longer writes to ${HERO_AKSARA}`)
  }
  return {
    latin,
    lost: trace.ambiguities.map((a) => ({ dropped: a.chosen ?? '', cls: a.class })),
  }
})

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
          The whole premise, worked rather than asserted: what each letter is,
          the rule that lets two letters spell four sounds, then three words
          landing on the same two letters with their differences struck out.

          Every aksara here is aria-hidden and a codepoint carries it instead —
          a screen reader announces U+1A06 as whatever its fallback font makes
          of it, which is nothing. Same reasoning as the OG image's alt text in
          layout.tsx. The Latin in every row is real text and says the thing.

          The codepoints are also invariant 10: this is the first aksara a
          visitor meets, and on the device where the font fails they are the
          only part of this figure that still carries the answer.
        */}
        <figure className="border-2 border-gold/30 bg-lontar/5 px-5 py-6 sm:px-8 sm:py-8">
          <figcaption id="hero-label" className={eyebrow()}>
            {copy.home.heroLabel}
          </figcaption>

          {/* Step one: what each letter is. Two glyphs, each above its own
              syllable, so the example below can actually be read. */}
          <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-4">
            {HERO_LETTERS.map((letter) => (
              <li key={letter.codepoint}>
                <span aria-hidden="true" className="aksara block text-aksara-hero text-lontar">
                  {letter.aksara}
                </span>
                <span className="mt-1 block text-lead text-lontar">{letter.latin}</span>
                <span className="block font-anotasi text-anotasi text-lontar/65">
                  {letter.codepoint} · {letter.unicodeName}
                </span>
              </li>
            ))}
          </ul>

          {/* Step two: the fact the whole example rests on, and which appeared
              nowhere on this page before — a consonant letter carries its own
              vowel. Without it, "ᨆᨈ is mata" is not merely unexplained, it is
              undecodable. Borrowed from the Aksara page rather than restated,
              so the two cannot drift. */}
          <p className="mt-5 max-w-measure text-lontar/85">{copy.aksara.inherentVowel}</p>

          {/* Step three: all three words at once, each with what the script
              threw away. The middle column is identical down all three rows,
              which IS the thesis — shown, rather than asserted and left for the
              reader to verify by pressing chips and noticing a non-event. */}
          <table aria-labelledby="hero-label" className="mt-5 w-full border-collapse">
            <thead>
              <tr className="border-b border-lontar/20 text-left">
                <th scope="col" className={`py-1 pr-6 ${eyebrow('quiet', 'sm')}`}>
                  {copy.home.heroLatin}
                </th>
                <th scope="col" className={`py-1 pr-6 ${eyebrow('quiet', 'sm')}`}>
                  {copy.home.heroWrites}
                </th>
                <th scope="col" className={`py-1 ${eyebrow('quiet', 'sm')}`}>
                  {copy.home.heroLost}
                </th>
              </tr>
            </thead>
            <tbody>
              {HERO_ROWS.map((row) => (
                <tr key={row.latin} className="border-b border-lontar/10 last:border-0">
                  <td className="py-2 pr-6 text-lead text-lontar">{row.latin}</td>
                  <td aria-hidden="true" className="aksara py-2 pr-6 text-aksara-row text-lontar">
                    {HERO_AKSARA}
                  </td>
                  <td className="py-2 text-sm">
                    {row.lost.length === 0 ? (
                      <span className="text-lontar/65">{copy.home.heroNothingLost}</span>
                    ) : (
                      row.lost.map((loss) => (
                        <span key={loss.cls} className="flex items-center gap-1.5">
                          <Rhombus size={9} tone="daun" />
                          <span className="text-lontar">
                            <span className="line-through">{loss.dropped}</span>{' '}
                            <span className={eyebrow('daun', 'sm')}>
                              {copy.ambiguityClass[loss.cls]}
                            </span>
                          </span>
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-4 max-w-measure text-sm text-lontar/75">
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
      {/*
        Two labelled regions rather than one nav holding two eyebrow-sized
        <h2>s. The labels are labels — 12px and letterspaced — and as headings
        they ranked level with section headings three times their size, so the
        page outline read as five equal siblings that plainly were not. Each
        group now names its own nav, which also replaces an outer landmark
        labelled "Lontara", the site's name rather than the region's.
      */}
      <div className="space-y-8">
        <nav aria-labelledby="nav-tools" className="space-y-3">
          <p id="nav-tools" className={eyebrow()}>{copy.home.groupTools}</p>
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
        </nav>

        <nav aria-labelledby="nav-reference" className="space-y-3">
          <p id="nav-reference" className={eyebrow('quiet')}>{copy.home.groupReference}</p>
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
        </nav>
      </div>

      {/*
        Both notices are unmissable, as Notice.tsx intends — but they used to
        be *first*, stacked above everything, two full-width panels with a red
        and a gold bar. That is the visual signature of an error state, and a
        stranger read the site as broken before learning what it did.

        They sit here instead: after the demonstration and the tools, before
        any of the explanation. Nothing is softened and nothing is collapsed —
        invariant 16 and PRD §9 both want these on the page, and they are still
        on it, and still ahead of every claim the site goes on to make. A
        caveat lands harder once the reader knows what is being disclaimed.

        Both keep their full form on /baca and /tulis, where someone is about
        to act on the output rather than read about it.
      */}
      <div className="space-y-3">
        <NotTranslatorNotice locale={locale} />
        <ReviewerGateNotice locale={locale} />
      </div>

      <section className="space-y-4 border-t-2 border-gold/30 pt-8">
        <h2 className="text-section text-lontar">{copy.home.defective.title}</h2>
        <p className="max-w-measure text-lontar/85">{copy.home.defective.body}</p>

        {/* The mata/matta/manta figure that stood here has moved into the hero.
            Showing it twice on one page would make the second one look like a
            different example that happens to read the same. */}

        {/* This section asserts the property. Someone who wants it measured
            rather than asserted should not have to find that page via the
            script reference. */}
        <p>
          <Link
            href={href(locale, 'aksara/serupa')}
            className={`inline-block no-underline ${eyebrow()}`}
          >
            {copy.aksara.collisionsLink} →
          </Link>
        </p>

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
