import { Outlet } from 'react-router'
import { NavigationProgress } from './NavigationProgress'

export function Root() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
    </>
  )
}
