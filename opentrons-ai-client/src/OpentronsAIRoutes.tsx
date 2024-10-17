import { Route, Navigate, Routes } from 'react-router-dom'
import { Box } from '@opentrons/components'
import { Landing } from './pages/Landing'

import type { RouteProps } from './resources/types'
import { MainContentContainer } from './organisms/MainContentContainer'

const opentronsAIRoutes: RouteProps[] = [
  {
    Component: MainContentContainer,
    name: 'Test',
    navLinkTo: '/test',
    path: '/test',
  },
]

export function OpentronsAIRoutes(): JSX.Element {
  const landingPage: RouteProps = {
    Component: Landing,
    name: 'Landing',
    navLinkTo: '/',
    path: '/',
  }
  const allRoutes: RouteProps[] = [...opentronsAIRoutes, landingPage]

  return (
    <Box width="100%">
      <Routes>
        {allRoutes.map(({ Component, path }: RouteProps) => {
          console.log(`Rendering route: ${path}`) // Debugging statement

          return <Route key={path} path={path} element={<Component />} />
        })}
        <Route path="*" element={<Navigate to={landingPage.path} />} />
      </Routes>
    </Box>
  )
}
