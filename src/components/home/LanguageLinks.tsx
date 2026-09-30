import { Link } from 'react-router'
import { findRegion, LANGUAGES, regionName } from '@/lib/regions'

/** Shortcuts into the browse page, one per local language of the region. */
export function LanguageLinks({ region }: { region: string }) {
  const r = findRegion(region)
  if (!r?.languageRows) return null
  const languages = r.languages
  return (
    <section aria-labelledby='lang-heading' className='space-y-3'>
      <h2 id='lang-heading' className='text-2xl font-extrabold'>
        Explore {regionName(region)} by language
      </h2>
      <ul className='flex flex-wrap gap-2'>
        {languages.map(code => (
          <li key={code}>
            <Link
              to={`/search?country=${region}&lang=${code}`}
              className='inline-block rounded-full border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand'
            >
              {LANGUAGES[code]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
