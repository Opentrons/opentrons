import { Route, Navigate, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'

import type { RouteProps } from './resources/types'

const opentronsAIRoutes: RouteProps[] = [
  // new routes can be added here
  // {
  //   Component: Landing,
  //   name: 'Test',
  //   navLinkTo: '/test',
  //   path: '/test',
  // },
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
    <Routes>
      {allRoutes.map(({ Component, path }: RouteProps) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
      <Route path="*" element={<Navigate to={landingPage.path} />} />
    </Routes>
  )
}
