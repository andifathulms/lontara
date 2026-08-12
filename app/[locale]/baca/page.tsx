import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { pageMetadata } from '@/lib/metadata'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { NotTranslatorNotice, ReviewerGateNotice } from '@/components/chrome/Notice'
import { Page, PageHeader } from '@/components/chrome/Page'
import { ReaderTool } from '@/components/reader/ReaderTool'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const copy = getCopy(locale)
  return pageMetadata({ locale, segments: ['baca'], title: copy.reader.title, description: copy.reader.lead })
}

/**
 * The reader — the flagship (PRD §3), and the feature the reviewer gate blocks
 * (PRD §9, invariant 12). The gate notice is rendered in its `strong` form here,
 * which adds the "not publicly released" line. The reader is built so that a
 * reviewer has something to review; it is not presented as finished.
 */
export default function BacaPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)

  return (
    <Page>
      <PageHeader title={copy.reader.title} lead={copy.reader.lead}>
        <NotTranslatorNotice locale={locale} />
        <ReviewerGateNotice locale={locale} strong />
      </PageHeader>

      <ReaderTool locale={locale} />
    </Page>
  )
}
