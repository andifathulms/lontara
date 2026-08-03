import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { href } from '@/lib/paths'
import { NotTranslatorNotice, ReviewerGateNotice } from '@/components/chrome/Notice'
import { Rhombus } from '@/components/ambiguity/Rhombus'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Page, PageHeader } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

const SECTIONS = ['baca', 'tulis', 'aksara', 'ejaan'] as const
const CLASSES = ['final', 'gemination', 'prenasal', 'glottal'] as const

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)

  return (
    <Page>
      <section className="space-y-5">
        <h1 className="text-display text-lontar max-w-measure">
          {copy.tagline}
        </h1>
        <p className="max-w-measure text-lead text-lontar/75">{copy.home.lead}</p>
        <NotTranslatorNotice locale={locale} />
        <ReviewerGateNotice locale={locale} />
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

        <figure className="bg-lontar/10 border border-lontar/20 px-5 py-4">
          <p className="font-anotasi text-lg text-lontar">{copy.home.defective.example}</p>
          <figcaption className="mt-2 text-sm text-lontar/65">
            {copy.home.defective.exampleNote}
          </figcaption>
        </figure>

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
