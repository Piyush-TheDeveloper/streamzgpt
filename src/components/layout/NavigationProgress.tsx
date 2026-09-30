import { useNavigation } from 'react-router'

/** Thin bar shown while a route (or its lazy chunk) is loading. */
export function NavigationProgress() {
  const { state } = useNavigation()
  if (state === 'idle') return null
  return (
    <div
      role='progressbar'
      aria-label='Loading page'
      className='fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-surface-2'
    >
      <div className='h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] rounded-full bg-brand' />
    </div>
  )
}
