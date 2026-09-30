import { useId, type InputHTMLAttributes } from 'react'

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string | null
}) {
  const id = useId()
  return (
    <div className='space-y-1.5'>
      <label htmlFor={id} className='text-sm text-muted'>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className='w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand'
        {...props}
      />
      {error && (
        <p id={`${id}-err`} className='text-xs text-danger'>
          {error}
        </p>
      )}
    </div>
  )
}
