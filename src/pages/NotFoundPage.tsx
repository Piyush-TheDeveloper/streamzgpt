import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className='mx-auto max-w-7xl px-4 py-24 text-center sm:px-6'>
      <h1 className='text-3xl font-bold'>Page not found</h1>
      <Link to='/' className='mt-4 inline-block text-brand hover:underline'>
        Back home
      </Link>
    </div>
  )
}
