import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import {
  FileUploadMessagesModal,
  GateModal,
  HintsModal,
  Kitchen,
  LabwareUploadModal,
  Navigation,
} from '../components/organisms'
import {
  Designer,
  Hardware,
  Landing,
  Liquids,
  Onboarding,
  ProtocolOverview,
  Settings,
} from '../pages'
import { ProtocolDesignerAppFallback } from '../resources/ProtocolDesignerAppFallback'
import styles from './protocolroutes.module.css'

import type { RouteProps } from '../types'

const pdRoutes: RouteProps[] = [
  {
    Component: ProtocolOverview,
    name: 'Protocol overview',
    navLinkTo: '/overview',
    path: '/overview',
  },
  {
    Component: Liquids,
    name: 'Liquids',
    navLinkTo: '/liquids',
    path: '/liquids',
  },
  {
    Component: Designer,
    name: 'Edit protocol',
    navLinkTo: '/designer',
    path: '/designer',
  },
  {
    Component: Onboarding,
    name: 'Create new protocol',
    navLinkTo: '/createNew',
    path: '/createNew',
  },
  {
    Component: Settings,
    name: 'Settings',
    navLinkTo: '/settings',
    path: '/settings',
  },
  {
    Component: Hardware,
    name: 'Hardware',
    navLinkTo: '/hardware',
    path: '/hardware',
  },
]

export function ProtocolRoutes(): JSX.Element {
  const landingPage: RouteProps = {
    Component: Landing,
    name: 'Landing',
    navLinkTo: '/',
    path: '/',
  }
  const allRoutes: RouteProps[] = [...pdRoutes, landingPage]
  const navigate = useNavigate()
  const handleReset = (): void => {
    navigate('/', { replace: true })
  }

  return (
    <ErrorBoundary
      FallbackComponent={ProtocolDesignerAppFallback}
      onReset={handleReset}
    >
      <Navigation />
      <Kitchen>
        <main className={styles.main_container}>
          <GateModal />
          <LabwareUploadModal />
          <FileUploadMessagesModal />
          <HintsModal />
          <Routes>
            {allRoutes.map(({ Component, path }: RouteProps) => {
              return <Route key={path} path={path} element={<Component />} />
            })}
            <Route path="*" element={<Navigate to={landingPage.path} />} />
          </Routes>
        </main>
      </Kitchen>
    </ErrorBoundary>
  )
}
