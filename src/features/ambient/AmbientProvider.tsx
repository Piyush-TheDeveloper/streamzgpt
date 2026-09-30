import { useState, type CSSProperties, type ReactNode } from 'react'
import { AmbientContext } from './AmbientContext'

export function AmbientProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<string | null>(null)
  return (
    <AmbientContext value={setColor}>
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 -z-10 transition-[--ambient] duration-700 ease-out'
        style={
          {
            ...(color ? { '--ambient': color } : null),
            background:
              'radial-gradient(70% 55% at 50% -5%, color-mix(in srgb, var(--ambient) 38%, transparent), transparent 70%), radial-gradient(45% 40% at 100% 100%, color-mix(in srgb, var(--ambient) 16%, transparent), transparent 70%)',
          } as CSSProperties
        }
      />
      {children}
    </AmbientContext>
  )
}
