import * as React from 'react'
import { useSelector } from 'react-redux'
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
import { CalibrationDashboard } from '../pages/Devices/CalibrationDashboard'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'
import { ProtocolRunDetails } from '../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../pages/Devices/RobotSettings'
import { ProtocolsLanding } from '../pages/Protocols/ProtocolsLanding'
import { ProtocolDetails } from '../pages/Protocols/ProtocolDetails'
import { AppSettings } from '../pages/AppSettings'
import { Labware } from '../pages/Labware'
import { InitialSplash } from '../pages/OnDeviceDisplay/InitialSplash'
import { ConnectedNetworkInfo } from '../pages/OnDeviceDisplay/ConnectedNetworkInfo'
import { SelectWifiNetwork } from '../pages/OnDeviceDisplay/SelectWifiNetwork'
import { SetWifiCred } from '../pages/OnDeviceDisplay/SetWifiCred'
import { NetworkSetupMenu } from '../pages/OnDeviceDisplay/NetworkSetupMenu'
import { getIsOnDevice } from '../redux/config'
import { getLocalRobot } from '../redux/discovery'
import { useSoftwareUpdatePoll } from './hooks'
import { Navbar } from './Navbar'
import { PortalRoot as ModalPortalRoot, TopPortalRoot } from './portal'

import type { RouteProps } from './types'

const stopEvent = (event: React.MouseEvent): void => event.preventDefault()

export const AppComponent = (): JSX.Element => {
  useSoftwareUpdatePoll()
  const isOnDevice = useSelector(getIsOnDevice)
  const localRobot = useSelector(getLocalRobot)

  const allRoutes: RouteProps[] = [
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
      Component: Labware,
      name: 'Labware',
      navLinkTo: '/labware',
      path: '/labware',
    },
    {
      Component: DevicesLanding,
      exact: true,
      name: 'Devices',
      navLinkTo: !isOnDevice ? '/devices' : undefined,
      path: '/devices',
    },
    {
      Component: DeviceDetails,
      exact: true,
      name: 'Device',
      navLinkTo: isOnDevice
        ? // placeholder robot name, for empty localhost discovery cache
          `/devices/${localRobot?.name ?? 'localhost-robot-name'}`
        : undefined,
      path: '/devices/:robotName',
    },
    {
      Component: RobotSettings,
      exact: true,
      name: 'Robot Settings',
      path: '/devices/:robotName/robot-settings/:robotSettingsTab?',
    },
    {
      Component: CalibrationDashboard,
      exact: true,
      name: 'Calibration Dashboard',
      path: '/devices/:robotName/robot-settings/calibration/dashboard',
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

  const onDeviceDisplayRoutes: RouteProps[] = [
    {
      Component: InitialSplash,
      exact: true,
      name: 'Start Device Setup',
      path: '/device-setup',
    },
    {
      Component: SelectWifiNetwork,
      exact: true,
      name: 'Select Network',
      path: '/connect-via-wifi',
    },
    {
      Component: SetWifiCred,
      exact: true,
      name: 'Set Wifi Cred',
      path: '/set-wifi-cred/:ssid',
    },
    {
      Component: ConnectedNetworkInfo,
      exact: true,
      name: 'Connected Network Info',
      path: '/connected-network-info/:ssid',
    },
    {
      Component: NetworkSetupMenu,
      exact: true,
      name: 'Network setup menu',
      path: '/network-setup-menu',
    },
  ]

  const routes = isOnDevice ? onDeviceDisplayRoutes : allRoutes

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
        {isOnDevice ? (
          <>
            <Box width="100%">
              <Switch>
                {routes.map(({ Component, exact, path }: RouteProps) => {
                  return (
                    <Route key={path} exact={exact} path={path}>
                      <Box
                        position={POSITION_RELATIVE}
                        width="100%"
                        height="100%"
                        backgroundColor={COLORS.fundamentalsBackground}
                        overflow={OVERFLOW_SCROLL}
                      >
                        <ModalPortalRoot />
                        <Component />
                      </Box>
                    </Route>
                  )
                })}
                <Redirect to="/device-setup" />
              </Switch>
              <Alerts />
            </Box>
          </>
        ) : (
          <>
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
                        backgroundColor={COLORS.fundamentalsBackground}
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
          </>
        )}
      </Flex>
    </>
  )
}

export const App = hot(AppComponent)
