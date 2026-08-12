import { getCopy } from '@/lib/i18n/copy'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/locales'
import { REPOSITORY_URL, SITE_URL } from '@/lib/paths'

/**
 * Structured data, so a search engine can tell what this is and what it is
 * about.
 *
 * Nothing here is a marketing claim. There is no rating, no review count, no
 * price, no invented audience — those are the fields that get structured data
 * ignored or penalised, and this project has none of them to report honestly.
 *
 * What it does say is the one thing that helps most: this page is *about the
 * Buginese language and its script*, linked to the Wikidata entities for both,
 * so the site can be associated with a subject rather than only with a
 * three-syllable word that also names a palm leaf, a font, and an encyclopedia
 * article (PRD §14).
 *
 * `applicationCategory` is EducationalApplication and the description is the
 * tagline. Invariant 16 holds here as everywhere: nothing in this object says
 * or implies that the tool translates.
 */
export function StructuredData({ locale }: { locale: Locale }) {
  const copy = getCopy(locale)

  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: copy.siteName,
    url: `${SITE_URL}${locale}/`,
    description: copy.tagline,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript.',
    isAccessibleForFree: true,
    inLanguage: LOCALES,
    author: {
      '@type': 'Person',
      name: 'Andi Fathul Mukminin Salahuddin',
    },
    codeRepository: REPOSITORY_URL,
    license: 'https://opensource.org/licenses/MIT',
    about: [
      {
        '@type': 'Language',
        name: 'Buginese',
        alternateName: ['Basa Ugi', 'Bugis'],
        sameAs: 'https://www.wikidata.org/wiki/Q33383',
      },
      {
        '@type': 'Thing',
        name: 'Lontara script',
        alternateName: ['Aksara Lontara', 'Buginese script'],
        sameAs: 'https://www.wikidata.org/wiki/Q1093269',
      },
    ],
    inDefaultLanguage: DEFAULT_LOCALE,
  }

  return (
    <script
      type="application/ld+json"
      // The object is built here from typed constants, never from user input,
      // so there is nothing in it that could close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
