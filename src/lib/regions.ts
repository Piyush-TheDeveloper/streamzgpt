export interface Region {
  code: string
  name: string
  /** ISO 639-1 codes of the languages people there watch, most common first. */
  languages: string[]
  /** True when those languages are native to the country (so "Tamil movies from India" is meaningful). */
  languageRows?: boolean
}

export const WORLDWIDE = 'ALL'

export const REGIONS: Region[] = [
  {
    code: 'IN',
    name: 'India',
    languages: ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'pa'],
    languageRows: true,
  },
  { code: 'US', name: 'United States', languages: ['en', 'es'] },
  { code: 'GB', name: 'United Kingdom', languages: ['en'] },
  { code: 'KR', name: 'South Korea', languages: ['ko'] },
  { code: 'JP', name: 'Japan', languages: ['ja'] },
  { code: 'FR', name: 'France', languages: ['fr'] },
  { code: 'ES', name: 'Spain', languages: ['es'] },
  { code: 'DE', name: 'Germany', languages: ['de'] },
  { code: 'IT', name: 'Italy', languages: ['it'] },
  { code: 'BR', name: 'Brazil', languages: ['pt'] },
  { code: 'MX', name: 'Mexico', languages: ['es'] },
  { code: 'CN', name: 'China', languages: ['zh'] },
  { code: 'TR', name: 'Turkey', languages: ['tr'] },
  { code: 'TH', name: 'Thailand', languages: ['th'] },
]

export const LANGUAGES: Record<string, string> = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  pa: 'Punjabi',
  en: 'English',
  es: 'Spanish',
  ko: 'Korean',
  ja: 'Japanese',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  tr: 'Turkish',
  th: 'Thai',
}

export const DEFAULT_REGION = 'IN'

export const findRegion = (code: string | null | undefined) =>
  REGIONS.find(r => r.code === code)

export const isKnownRegion = (
  code: string | null | undefined,
): code is string => code === WORLDWIDE || findRegion(code) !== undefined

export const regionName = (code: string) =>
  code === WORLDWIDE ? 'the world' : (findRegion(code)?.name ?? code)

/** Picks a starting region from a locale such as "en-IN"; falls back to India. */
export function detectRegion(locale: string | undefined): string {
  const code = /[-_]([A-Za-z]{2})$/.exec(locale ?? '')?.[1]?.toUpperCase()
  return findRegion(code) ? code! : DEFAULT_REGION
}
