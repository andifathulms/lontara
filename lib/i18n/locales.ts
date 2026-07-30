/**
 * Indonesian first, English secondary (PRD, header table). Bugis terminology is
 * used in both — `aksara`, `pallawa`, `sulapa' eppa'`, `baca`, `tulis` — and is
 * never replaced with an English approximation.
 */
export const LOCALES = ['id', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export const LOCALE_LABEL: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
}

/** `output: 'export'` needs the full param set up front for every dynamic segment. */
export function localeParams(): Array<{ locale: Locale }> {
  return LOCALES.map((locale) => ({ locale }))
}
