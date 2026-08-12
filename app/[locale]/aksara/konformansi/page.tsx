import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { pageMetadata } from '@/lib/metadata'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { HARD_STRINGS } from '@/lib/rendering/hardStrings'
import { eyebrow } from '@/components/chrome/eyebrow'
import { Page, PageHeader } from '@/components/chrome/Page'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const copy = getCopy(locale)
  return pageMetadata({ locale, segments: ['aksara', 'konformansi'], title: copy.aksara.conformanceLink, description: copy.aksara.conformanceLead })
}

/**
 * The rendering conformance page (PRD §8). It exists to be opened on a real
 * phone: each case shows the string large, the codepoints beneath it, and — in
 * words — what a pass looks like, so someone checking on iOS Safari can decide
 * without an image to compare against.
 *
 * Rendering first (CLAUDE.md, Working style): a correct codepoint sequence that
 * renders as garbage is not done.
 */
export default function ConformancePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)

  return (
    <Page>
      <PageHeader
        title={copy.aksara.conformanceLink}
        lead={copy.aksara.conformanceLead}
      >
        <dl className="font-anotasi text-xs text-lontar/65 space-y-1">
          <div>
            <dt className="inline text-gold/80">face </dt>
            <dd className="inline">
              {HARD_STRINGS.font.face} {HARD_STRINGS.font.version}
            </dd>
          </div>
          <div>
            <dt className="inline text-gold/80">shipped </dt>
            <dd className="inline">{HARD_STRINGS.font.shipped}</dd>
          </div>
          <div>
            <dt className="inline text-gold/80">features </dt>
            <dd className="inline">{HARD_STRINGS.font.features.join(' · ')}</dd>
          </div>
          <div>
            <dt className="inline text-gold/80">check on </dt>
            <dd className="inline">{HARD_STRINGS.devices.join(' · ')}</dd>
          </div>
        </dl>
      </PageHeader>

      <section className="space-y-4">
        <h2 className="text-section text-lontar">
          {locale === 'id' ? 'Kasus uji' : 'Test cases'}
        </h2>
        <ol className="space-y-px bg-gold/30">
        {HARD_STRINGS.cases.map((c, index) => (
          <li key={c.id} className="bg-grid px-5 py-6 grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              <p className={eyebrow()}>
                {String(index + 1).padStart(2, '0')} · {c.id}
              </p>
              {/* The lontar-leaf band the aksara sits on. PRD §10. */}
              <div className="aksara bg-lontar text-grid px-4 py-5 text-aksara-band leading-relaxed break-words">
                {c.text}
              </div>
              <p className="font-anotasi text-anotasi leading-relaxed text-lontar/65 break-words">
                {c.codepoints.join(' ')}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <h3 className={eyebrow('quiet')}>
                  {locale === 'id' ? 'Mengapa kasus ini' : 'Why this case'}
                </h3>
                <p className="mt-1 text-lontar/75">{c.why}</p>
              </div>
              <div>
                <h3 className={eyebrow('quiet')}>
                  {locale === 'id' ? 'Lulus berarti' : 'A pass means'}
                </h3>
                <p className="mt-1 text-lontar/85">{c.expect}</p>
              </div>
            </div>
          </li>
        ))}
        </ol>
      </section>

      <aside aria-labelledby="konformansi-open" className="border-l-4 border-gold bg-gold/10 px-4 py-3 space-y-2">
        <p id="konformansi-open" className={eyebrow()}>
          {locale === 'id' ? 'Kasus yang belum diketahui' : 'Cases not yet identified'}
        </p>
        {HARD_STRINGS.openCases.map((o) => (
          <p key={o.note} className="text-sm text-lontar/85">
            {o.note}
          </p>
        ))}
      </aside>
    </Page>
  )
}
