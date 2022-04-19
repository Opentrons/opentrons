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

import { useFeatureFlag } from '../redux/config'
import { GlobalStyle } from '../atoms/GlobalStyle'
import { Alerts } from '../organisms/Alerts'

import { Breadcrumbs } from '../molecules/Breadcrumbs'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'
import { ProtocolRunDetails } from '../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../pages/Devices/RobotSettings'
import { usePathCrumbs } from './hooks'
import { ProtocolsLanding } from '../pages/Protocols/ProtocolsLanding'
import { ProtocolDetails } from '../pages/Protocols/ProtocolDetails'
import { AppSettings } from '../organisms/AppSettings'
import { Labware } from '../organisms/Labware'
import { Navbar } from './Navbar'
import { LegacyApp } from './LegacyApp'
import { PortalRoot as ModalPortalRoot, TopPortalRoot } from './portal'

import type { RouteProps } from './types'

export const nextGenRoutes: RouteProps[] = [
  {
    component: ProtocolsLanding,
    exact: true,
    name: 'Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  {
    component: ProtocolDetails,
    exact: true,
    name: 'Protocol Details',
    path: '/protocols/:protocolKey',
  },
  {
    component: () => <div>deck setup</div>,
    name: 'Deck Setup',
    path: '/protocols/:protocolKey/deck-setup',
  },
  {
    component: Labware,
    name: 'Labware',
    navLinkTo: '/labware',
    // labwareId param is for details slideout
    path: '/labware/:labwareId?',
  },
  {
    component: DevicesLanding,
    exact: true,
    name: 'Devices',
    navLinkTo: '/devices',
    path: '/devices',
  },
  {
    component: DeviceDetails,
    exact: true,
    name: 'Device Details',
    path: '/devices/:robotName',
  },
  {
    component: RobotSettings,
    exact: true,
    name: 'Robot Settings',
    path: '/devices/:robotName/robot-settings/:robotSettingsTab?',
  },
  {
    component: () => <div>protocol runs landing</div>,
    exact: true,
    name: 'Protocol Runs',
    path: '/devices/:robotName/protocol-runs',
  },
  {
    component: ProtocolRunDetails,
    name: 'Run Details',
    path: '/devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab?',
  },
  {
    component: AppSettings,
    exact: true,
    name: 'App Settings',
    path: '/app-settings/:appSettingsTab?',
  },
]

const stopEvent = (event: React.MouseEvent): void => event.preventDefault()

export const AppComponent = (): JSX.Element => {
  const pathCrumbs = usePathCrumbs()
  const isLegacyApp = useFeatureFlag('hierarchyReorganization')

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
        {isLegacyApp ? (
          <LegacyApp />
        ) : (
          <>
            <TopPortalRoot />
            <Navbar routes={nextGenRoutes} />
            <Box width="100%">
              <Breadcrumbs pathCrumbs={pathCrumbs} />
              <Box
                position={POSITION_RELATIVE}
                width="100%"
                height="100%"
                backgroundColor={COLORS.background}
                overflow={OVERFLOW_SCROLL}
              >
                <ModalPortalRoot />
                <Switch>
                  {nextGenRoutes.map(
                    ({ component, exact, path }: RouteProps) => {
                      return (
                        <Route
                          key={path}
                          component={component}
                          exact={exact}
                          path={path}
                        />
                      )
                    }
                  )}
                  <Redirect exact from="/" to="/devices" />
                  {/* this redirect from /robots is necessary because the existing app <Redirect /> to /robots renders before feature flags load */}
                  <Redirect from="/robots" to="/devices" />
                </Switch>
                <Alerts />
              </Box>
            </Box>
          </>
        )}
      </Flex>
    </>
  )
}

export const App = hot(AppComponent)
