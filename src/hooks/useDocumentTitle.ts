import { useEffect } from 'react'

const SITE = 'StreamzGPT'

export const pageTitle = (title?: string | null) =>
  title ? `${title} · ${SITE}` : SITE

/** Sets a descriptive page title (WCAG 2.4.2); restores the default on unmount. */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = pageTitle(title)
    return () => {
      document.title = SITE
    }
  }, [title])
}
