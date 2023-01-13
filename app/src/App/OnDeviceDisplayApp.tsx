import * as React from 'react'
import { Switch, Route } from 'react-router-dom'

import {
  Box,
  POSITION_RELATIVE,
  COLORS,
  OVERFLOW_SCROLL,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { BackButton } from '../atoms/buttons'
import { ConnectedNetworkInfo } from '../pages/OnDeviceDisplay/ConnectedNetworkInfo'
import { ConnectViaEthernet } from '../pages/OnDeviceDisplay/ConnectViaEthernet'
import { ConnectViaUSB } from '../pages/OnDeviceDisplay/ConnectViaUSB'
import { ConfirmRobotName } from '../pages/OnDeviceDisplay/ConfirmRobotName'
import { InitialSplash } from '../pages/OnDeviceDisplay/InitialSplash'
import { NameRobot } from '../pages/OnDeviceDisplay/NameRobot'
import { NetworkSetupMenu } from '../pages/OnDeviceDisplay/NetworkSetupMenu'
import { TempODDMenu } from '../pages/OnDeviceDisplay/TempODDMenu'
import { RobotDashboard } from '../pages/OnDeviceDisplay/RobotDashboard'
import { SelectWifiNetwork } from '../pages/OnDeviceDisplay/SelectWifiNetwork'
import { SetWifiCred } from '../pages/OnDeviceDisplay/SetWifiCred'
import { UpdateRobot } from '../pages/OnDeviceDisplay/UpdateRobot'
import { Welcome } from '../pages/OnDeviceDisplay/Welcome'
import { PortalRoot as ModalPortalRoot } from './portal'

import type { RouteProps } from './types'

export const onDeviceDisplayRoutes: RouteProps[] = [
  {
    Component: InitialSplash,
    exact: true,
    name: 'Initial Splash',
    path: '/',
  },
  {
    Component: Welcome,
    exact: true,
    name: 'Get started',
    path: '/get-started',
  },
  {
    Component: TempODDMenu,
    exact: true,
    name: 'Temp ODD Menu',
    path: '/menu',
  },
  {
    Component: RobotDashboard,
    exact: true,
    name: 'Robot Dashboard',
    path: '/dashboard',
  },
  {
    Component: NetworkSetupMenu,
    exact: true,
    name: 'Network setup menu',
    path: '/network-setup',
  },
  {
    Component: SelectWifiNetwork,
    exact: true,
    name: 'Select Network',
    path: '/network-setup/wifi',
  },
  {
    Component: SetWifiCred,
    exact: true,
    name: 'Set Wifi Cred',
    path: '/network-setup/wifi/set-wifi-cred/:ssid',
  },
  {
    Component: ConnectedNetworkInfo,
    exact: true,
    name: 'Connected Network Info',
    path: '/network-setup/wifi/connected-network-info/:ssid',
  },
  {
    Component: ConnectViaEthernet,
    exact: true,
    name: 'Connect via Ethernet',
    path: '/network-setup/ethernet',
  },
  {
    Component: ConnectViaUSB,
    exact: true,
    name: 'Connect via USB',
    path: '/network-setup/usb',
  },
  {
    Component: ConfirmRobotName,
    exact: true,
    name: 'Name confirmation',
    // Note: kj 12/19/2022 this path might be changed since the ODD app will have rename screen
    // and it will use the same components for doing that.
    path: '/network-setup/confirm-name/:robotName',
  },
  {
    Component: () => (
      <>
        <BackButton />
        <Box>robot settings dashboard</Box>
      </>
    ),
    exact: true,
    name: 'Robot Settings Dashboard',
    path: '/robot-settings',
  },
  // insert robot settings subroutes
  {
    Component: () => (
      <>
        <BackButton />
        <Box>factory reset</Box>
      </>
    ),
    exact: true,
    name: 'Factory Reset',
    path: '/robot-settings/factory-reset',
  },
  {
    Component: NameRobot,
    exact: true,
    name: 'Rename Robot',
    path: '/robot-settings/rename-robot',
  },
  {
    Component: UpdateRobot,
    exact: true,
    name: 'Update Robot',
    path: '/robot-settings/update-robot',
  },
  {
    Component: () => (
      <>
        <BackButton />
        <Box>protocol dashboard</Box>
      </>
    ),
    exact: true,
    name: 'Protocol Dashboard',
    path: '/protocols',
  },
  // insert protocol subroutes
  {
    Component: () => (
      <>
        <BackButton />
        <Box>protocol details</Box>
      </>
    ),
    exact: true,
    name: 'Protocol Details',
    path: '/protocols/:protocolId',
  },
  // TODO(bh: 2022-12-5): these "protocol run" page are a rough guess based on existing designs and site map
  // expect to change or add additional route params
  {
    Component: () => (
      <>
        <BackButton />
        <Box>protocol setup</Box>
      </>
    ),
    exact: true,
    name: 'Protocol Setup',
    path: '/protocols/:protocolId/:runId/setup',
  },
  {
    Component: () => (
      <>
        <BackButton />
        <Box>protocol run</Box>
      </>
    ),
    exact: true,
    name: 'Protocol Run',
    path: '/protocols/:protocolId/:runId/run',
  },
  {
    Component: () => (
      <>
        <BackButton />
        <Box>attach instruments</Box>
      </>
    ),
    exact: true,
    name: 'Attach Instruments Dashboard',
    path: '/attach-instruments',
  },
  // insert attach instruments subroutes
  {
    Component: () => (
      <>
        <BackButton />
        <Box>app settings</Box>
      </>
    ),
    exact: true,
    name: 'App Settings',
    path: '/app-settings',
  },
]

export const OnDeviceDisplayApp = (): JSX.Element => {
  return (
    <ApiHostProvider hostname="localhost">
      <Box width="100%">
        <Switch>
          {onDeviceDisplayRoutes.map(
            ({ Component, exact, path }: RouteProps) => {
              return (
                <Route key={path} exact={exact} path={path}>
                  <Box
                    position={POSITION_RELATIVE}
                    width="100%"
                    height="100%"
                    backgroundColor={COLORS.white}
                    overflow={OVERFLOW_SCROLL}
                  >
                    <ModalPortalRoot />
                    <Component />
                  </Box>
                </Route>
              )
            }
          )}
        </Switch>
      </Box>
    </ApiHostProvider>
  )
}
