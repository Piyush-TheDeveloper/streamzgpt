import { useEffect } from 'react'
import { useSetAmbient } from '@/features/ambient/AmbientContext'
import { sampleImageColor, toCss } from '@/lib/color'

/** Tints the app backdrop with the image's dominant colour; resets on unmount. */
export function useAmbientFromImage(url: string | null) {
  const setAmbient = useSetAmbient()
  useEffect(() => {
    if (!url) {
      setAmbient(null)
      return
    }
    let cancelled = false
    sampleImageColor(url).then(c => {
      if (!cancelled) setAmbient(c ? toCss(c) : null)
    })
    return () => {
      cancelled = true
    }
  }, [url, setAmbient])
  useEffect(() => () => setAmbient(null), [setAmbient])
}
