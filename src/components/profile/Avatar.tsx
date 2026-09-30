import { avatarById } from '@/lib/avatars'
import { cn } from '@/lib/utils'

export function Avatar({
  avatar,
  name,
  className,
}: {
  avatar: string
  name: string
  className?: string
}) {
  const { from, to } = avatarById(avatar)
  return (
    <span
      aria-hidden
      className={cn(
        'grid place-items-center rounded-full font-[family-name:var(--font-display)] font-extrabold uppercase text-on-brand',
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {name.trim().charAt(0) || '?'}
    </span>
  )
}
