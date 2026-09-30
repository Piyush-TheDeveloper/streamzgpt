export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className='mx-auto max-w-7xl px-4 py-24 text-center sm:px-6'>
      <h1 className='text-3xl font-bold'>{title}</h1>
      <p className='mt-3 text-muted'>Coming soon.</p>
    </div>
  )
}
