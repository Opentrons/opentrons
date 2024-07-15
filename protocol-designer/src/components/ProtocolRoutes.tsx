import * as React from 'react'
import { Route, Navigate, Routes, useLocation } from 'react-router-dom'
import { Box } from '@opentrons/components'
import { Landing } from '../pages/Landing'
import { ProtocolOverview } from '../pages/ProtocolOverview'
import { Liquids } from '../pages/Liquids'
import { StartingDeckState } from '../pages/StartingDeckState'
import { ProtocolSteps } from '../pages/ProtocolSteps'
import { CreateNewProtocol } from '../pages/CreateNewProtocol'
import { Navbar } from './Navbar'

import type { RouteProps } from './types'

const pdRoutes: RouteProps[] = [
  {
    Component: Landing,
    name: 'Landing',
    navLinkTo: '/',
    path: '/',
  },
  {
    Component: ProtocolOverview,
    name: 'Protocol overview',
    navLinkTo: '/protocolOverview',
    path: '/protocolOverview',
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
    navLinkTo: '/protocolSteps',
    path: '/protocolSteps',
  },
  {
    Component: CreateNewProtocol,
    name: 'Create new protocol',
    navLinkTo: '/createNewProtocol',
    path: '/createNewProtocol',
  },
]

export function ProtocolRoutes(): JSX.Element {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <>
      {currentPath !== '/' ? <Navbar routes={pdRoutes} /> : null}
      <Box width="100%">
        <Routes>
          {pdRoutes.map(({ Component, path }: RouteProps) => {
            return <Route key={path} path={path} element={<Component />} />
          })}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </>
  )
}
