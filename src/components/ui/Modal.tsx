import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Accessible modal on the native <dialog>: focus is trapped, Esc closes, and
 * closing it (Esc, the X, the backdrop or `close()`) returns focus to whatever
 * opened it. Mount it only while open so its form state starts fresh.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  /** Called once the dialog has closed (by any route); unmount it here. */
  onClose: () => void
  children: ReactNode
  /** Receives `close`, which closes the dialog and restores focus natively. */
  footer?: (close: () => void) => ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    // No cleanup close(): unmounting removes the dialog, and close() would fire
    // onClose again under StrictMode.
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  // Closing goes through the dialog's own close() so the browser restores focus
  // to the trigger; it's requested via state so no ref is read during render.
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (closing) ref.current?.close()
  }, [closing])
  const close = () => setClosing(true)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={e => e.target === ref.current && close()}
      className='m-auto max-h-[90dvh] w-[min(94vw,36rem)] overflow-hidden rounded-3xl border border-border bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm'
    >
      <div className='flex max-h-[90dvh] flex-col'>
        <div className='flex items-center justify-between gap-4 border-b border-border px-6 py-4'>
          <h2 id={titleId} className='text-xl font-extrabold'>
            {title}
          </h2>
          <button
            type='button'
            onClick={close}
            aria-label='Close'
            className='grid size-11 place-items-center rounded-full hover:bg-surface-2'
          >
            <X className='size-5' aria-hidden />
          </button>
        </div>
        <div className='flex-1 overflow-y-auto px-6 py-5'>{children}</div>
        {footer && (
          <div className='flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-6 py-4'>
            {footer(close)}
          </div>
        )}
      </div>
    </dialog>
  )
}
