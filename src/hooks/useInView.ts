import { useEffect, useRef, useState } from 'react'

/** True once the element has come within `margin` of the viewport (sticky). */
export function useInView<T extends Element>(margin = '0px') {
  const ref = useRef<T>(null)
  // Without IntersectionObserver there's nothing to wait for: treat as visible.
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      entries => entries.some(e => e.isIntersecting) && setInView(true),
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, margin])
  return [ref, inView] as const
}
