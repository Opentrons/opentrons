import * as React from 'react'
import { Route, Navigate, Routes } from 'react-router-dom'
import { Box } from '@opentrons/components'
import { Landing } from './pages/Landing'
import { ProtocolOverview } from './pages/ProtocolOverview'
import { Liquids } from './pages/Liquids'
import { Designer } from './pages/Designer'
import { CreateNewProtocolWizard } from './pages/CreateNewProtocolWizard'
import { NavigationBar } from './NavigationBar'
import {
  Kitchen,
  FileUploadMessagesModal,
  LabwareUploadModal,
} from './organisms'

import type { RouteProps } from './types'

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
    Component: CreateNewProtocolWizard,
    name: 'Create new protocol',
    navLinkTo: '/createNew',
    path: '/createNew',
  },
]

export function ProtocolRoutes(): JSX.Element {
  console.log('in protocol routes')
  const landingPage: RouteProps = {
    Component: Landing,
    name: 'Landing',
    navLinkTo: '/',
    path: '/',
  }
  const allRoutes: RouteProps[] = [...pdRoutes, landingPage]

  return (
    <>
      <NavigationBar />
      <Kitchen>
        <Box width="100%">
          <LabwareUploadModal />
          <FileUploadMessagesModal />
          <Routes>
            {allRoutes.map(({ Component, path }: RouteProps) => {
              return <Route key={path} path={path} element={<Component />} />
            })}
            <Route path="*" element={<Navigate to={landingPage.path} />} />
          </Routes>
        </Box>
      </Kitchen>
    </>
  )
}
