import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { isAppwriteConfigured } from '@/lib/appwrite'

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className='grid min-h-dvh place-items-center px-4 py-10'>
      <div className='w-full max-w-sm space-y-6 rounded-2xl border border-border bg-surface p-6 sm:p-8'>
        <Link
          to='/'
          className='block text-center font-[family-name:var(--font-display)] text-2xl font-extrabold'
        >
          streamz<span className='text-brand'>gpt</span>
        </Link>
        <h1 className='text-center text-xl font-semibold'>{title}</h1>
        {!isAppwriteConfigured && (
          <p
            role='alert'
            className='rounded-md bg-surface-2 p-3 text-sm text-muted'
          >
            Appwrite isn’t configured. Set VITE_APPWRITE_ENDPOINT and
            VITE_APPWRITE_PROJECT_ID in .env.local.
          </p>
        )}
        {children}
        <p className='text-center text-sm text-muted'>{footer}</p>
      </div>
    </div>
  )
}
