import * as React from 'react'
import { Route, Navigate, Routes } from 'react-router-dom'
import { Box } from '@opentrons/components'
import { Landing } from './pages/Landing'
import { ProtocolOverview } from './pages/ProtocolOverview'
import { Liquids } from './pages/Liquids'
import { StartingDeckState } from './pages/StartingDeckState'
import { ProtocolSteps } from './pages/ProtocolSteps'
import { CreateNewProtocolWizard } from './pages/CreateNewProtocolWizard'
import { NavigationBar } from './NavigationBar'

import type { RouteProps } from './types'

const LANDING_ROUTE = '/'
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
    Component: StartingDeckState,
    name: 'Starting deck state',
    navLinkTo: '/startingDeckState',
    path: '/startingDeckState',
  },
  {
    Component: ProtocolSteps,
    name: 'Protocol steps',
    navLinkTo: '/steps',
    path: '/steps',
  },
  {
    Component: CreateNewProtocolWizard,
    name: 'Create new protocol',
    navLinkTo: '/createNew',
    path: '/createNew',
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

  return (
    <>
      <NavigationBar routes={pdRoutes} />
      <Box width="100%">
        <Routes>
          {allRoutes.map(({ Component, path }: RouteProps) => {
            return <Route key={path} path={path} element={<Component />} />
          })}
          <Route path="*" element={<Navigate to={LANDING_ROUTE} />} />
        </Routes>
      </Box>
    </>
  )
}
