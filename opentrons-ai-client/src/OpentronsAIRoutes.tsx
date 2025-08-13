import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { Chat } from './pages/Chat'
import { CreateProtocol } from './pages/CreateProtocol'
import { Landing } from './pages/Landing'
import { Settings } from './pages/Settings'
import { UpdateProtocol } from './pages/UpdateProtocol'
import { AiAppFallback } from './resources/AiAppFallback'

import type { RouteProps } from './resources/types'

const opentronsAIRoutes: RouteProps[] = [
  {
    Component: Chat,
    name: 'Chat',
    navLinkTo: '/chat',
    path: '/chat',
  },
  {
    Component: CreateProtocol,
    name: 'Create A New Protocol',
    navLinkTo: '/new-protocol',
    path: '/new-protocol',
  },
  {
    Component: UpdateProtocol,
    name: 'Update An Existing Protocol',
    navLinkTo: '/update-protocol',
    path: '/update-protocol',
  },
  {
    Component: Settings,
    name: 'Settings',
    navLinkTo: '/settings',
    path: '/settings',
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

  const navigate = useNavigate()
  const handleReset = (): void => {
    navigate('/', { replace: true })
  }

  return (
    <ErrorBoundary FallbackComponent={AiAppFallback} onReset={handleReset}>
      <Routes>
        {allRoutes.map(({ Component, path }: RouteProps) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
        <Route path="*" element={<Navigate to={landingPage.path} />} />
      </Routes>
    </ErrorBoundary>
  )
}
