import * as React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { hot } from 'react-hot-loader/root'

import {
  Flex,
  Box,
  POSITION_RELATIVE,
  POSITION_FIXED,
  DIRECTION_ROW,
  COLORS,
  OVERFLOW_SCROLL,
} from '@opentrons/components'

import { GlobalStyle } from '../atoms/GlobalStyle'
import { Alerts } from '../organisms/Alerts'
import { Breadcrumbs } from '../organisms/Breadcrumbs'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'
import { ProtocolRunDetails } from '../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../pages/Devices/RobotSettings'
import { ProtocolsLanding } from '../pages/Protocols/ProtocolsLanding'
import { ProtocolDetails } from '../pages/Protocols/ProtocolDetails'
import { AppSettings } from '../pages/AppSettings'
import { Labware } from '../pages/Labware'
import { Navbar } from './Navbar'
import { PortalRoot as ModalPortalRoot, TopPortalRoot } from './portal'

import type { RouteProps } from './types'
import { useSoftwareUpdatePoll } from './hooks'

export const routes: RouteProps[] = [
  {
    Component: ProtocolsLanding,
    exact: true,
    name: 'Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  {
    Component: ProtocolDetails,
    exact: true,
    name: 'Protocol Details',
    path: '/protocols/:protocolKey',
  },
  {
    Component: () => <div>deck setup</div>,
    name: 'Deck Setup',
    path: '/protocols/:protocolKey/deck-setup',
  },
  {
    Component: Labware,
    name: 'Labware',
    navLinkTo: '/labware',
    // labwareId param is for details slideout
    path: '/labware/:labwareId?',
  },
  {
    Component: DevicesLanding,
    exact: true,
    name: 'Devices',
    navLinkTo: '/devices',
    path: '/devices',
  },
  {
    Component: DeviceDetails,
    exact: true,
    name: 'Device Details',
    path: '/devices/:robotName',
  },
  {
    Component: RobotSettings,
    exact: true,
    name: 'Robot Settings',
    path: '/devices/:robotName/robot-settings/:robotSettingsTab?',
  },
  {
    Component: () => <div>protocol runs landing</div>,
    exact: true,
    name: 'Protocol Runs',
    path: '/devices/:robotName/protocol-runs',
  },
  {
    Component: ProtocolRunDetails,
    name: 'Run Details',
    path: '/devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab?',
  },
  {
    Component: AppSettings,
    exact: true,
    name: 'App Settings',
    path: '/app-settings/:appSettingsTab?',
  },
]

const stopEvent = (event: React.MouseEvent): void => event.preventDefault()

export const AppComponent = (): JSX.Element => {
  useSoftwareUpdatePoll()

  return (
    <>
      <GlobalStyle />
      <Flex
        position={POSITION_FIXED}
        flexDirection={DIRECTION_ROW}
        width="100%"
        height="100vh"
        onDragOver={stopEvent}
        onDrop={stopEvent}
      >
        <TopPortalRoot />
        <Navbar routes={routes} />
        <Box width="100%">
          <Switch>
            {routes.map(({ Component, exact, path }: RouteProps) => {
              return (
                <Route key={path} exact={exact} path={path}>
                  <Breadcrumbs />
                  <Box
                    position={POSITION_RELATIVE}
                    width="100%"
                    height="100%"
                    backgroundColor={COLORS.background}
                    overflow={OVERFLOW_SCROLL}
                  >
                    <ModalPortalRoot />
                    <Component />
                  </Box>
                </Route>
              )
            })}
            <Redirect exact from="/" to="/protocols" />
          </Switch>
          <Alerts />
        </Box>
      </Flex>
    </>
  )
}

export const App = hot(AppComponent)
