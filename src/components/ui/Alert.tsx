import type { ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertVariant = 'error' | 'warning' | 'info'

const STYLES: Record<
  AlertVariant,
  { box: string; icon: string; Icon: LucideIcon; label: string }
> = {
  error: {
    box: 'border-danger/60 bg-danger/10',
    icon: 'text-danger',
    Icon: AlertCircle,
    label: 'Error',
  },
  warning: {
    box: 'border-warning/60 bg-warning/10',
    icon: 'text-warning',
    Icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    box: 'border-info/60 bg-info/10',
    icon: 'text-info',
    Icon: Info,
    label: 'Note',
  },
}

/**
 * Inline message with a coloured border, tint and icon. The type is also
 * announced in text, so it never relies on colour alone (WCAG 1.4.1).
 * Errors interrupt screen readers (role="alert"); warnings and info are polite.
 */
export function Alert({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  /** e.g. a "Try again" button */
  action?: ReactNode
  onDismiss?: () => void
  className?: string
}) {
  const { box, icon, Icon, label } = STYLES[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm',
        box,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', icon)} aria-hidden />
      <div className='min-w-0 flex-1 space-y-1'>
        <div className='font-semibold'>
          <span className='sr-only'>{label}: </span>
          {title || children}
        </div>
        {title && children && <div className='text-fg/85'>{children}</div>}
        {action && <div className='pt-1'>{action}</div>}
      </div>
      {onDismiss && (
        <button
          type='button'
          onClick={onDismiss}
          aria-label='Dismiss'
          className='-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/10'
        >
          <X className='size-4' aria-hidden />
        </button>
      )}
    </div>
  )
}
