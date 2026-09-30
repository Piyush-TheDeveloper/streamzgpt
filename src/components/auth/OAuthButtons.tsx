import { signInWithOAuth } from '@/services/auth'

export function OAuthButtons() {
  const btn =
    'flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium transition hover:border-muted'
  return (
    <div className='space-y-3'>
      <button
        type='button'
        className={btn}
        onClick={() => signInWithOAuth('google')}
      >
        Continue with Google
      </button>
      <button
        type='button'
        className={btn}
        onClick={() => signInWithOAuth('apple')}
      >
        Continue with Apple
      </button>
      <div className='flex items-center gap-3 text-xs text-muted'>
        <span className='h-px flex-1 bg-border' />
        or
        <span className='h-px flex-1 bg-border' />
      </div>
    </div>
  )
}
