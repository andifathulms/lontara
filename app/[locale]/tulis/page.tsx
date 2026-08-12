import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { pageMetadata } from '@/lib/metadata'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { NotTranslatorNotice, ReviewerGateNotice } from '@/components/chrome/Notice'
import { Page, PageHeader } from '@/components/chrome/Page'
import { WriterTool } from '@/components/writer/WriterTool'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const copy = getCopy(locale)
  return pageMetadata({ locale, segments: ['tulis'], page: 'tulis', description: copy.writer.lead })
}

export default function TulisPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)

  return (
    <Page>
      <PageHeader title={copy.writer.title} lead={copy.writer.lead}>
        <NotTranslatorNotice locale={locale} />
        <ReviewerGateNotice locale={locale} />
      </PageHeader>

      <WriterTool locale={locale} />
    </Page>
  )
}
