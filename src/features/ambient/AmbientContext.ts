import { createContext, useContext } from 'react'

export const AmbientContext = createContext<(color: string | null) => void>(
  () => {},
)

/** Lets a page tint the whole app's backdrop (pass null to reset). */
export const useSetAmbient = () => useContext(AmbientContext)
