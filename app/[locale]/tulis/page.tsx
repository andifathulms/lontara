import { notFound } from 'next/navigation'
import { getCopy } from '@/lib/i18n/copy'
import { isLocale, localeParams, type Locale } from '@/lib/i18n/locales'
import { NotTranslatorNotice, ReviewerGateNotice } from '@/components/chrome/Notice'
import { WriterTool } from '@/components/writer/WriterTool'

export function generateStaticParams() {
  return localeParams()
}

export function generateMetadata({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  return { title: getCopy(locale).writer.title, description: getCopy(locale).writer.lead }
}

export default function TulisPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale
  const copy = getCopy(locale)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl text-lontar">{copy.writer.title}</h1>
        <p className="max-w-3xl text-lontar/75">{copy.writer.lead}</p>
        <NotTranslatorNotice locale={locale} />
        <ReviewerGateNotice locale={locale} />
      </header>

      <WriterTool locale={locale} />
    </div>
  )
}
