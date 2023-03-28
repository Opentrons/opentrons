import * as React from 'react'
import { useSelector } from 'react-redux'
import { Switch, Route, Redirect } from 'react-router-dom'

import {
  Box,
  POSITION_RELATIVE,
  COLORS,
  OVERFLOW_SCROLL,
  useIdle,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { BackButton } from '../atoms/buttons'
import { SleepScreen } from '../organisms/OnDeviceDisplay/SleepScreen'
import { ToasterOven } from '../organisms/ToasterOven'
import { ConnectViaEthernet } from '../pages/OnDeviceDisplay/ConnectViaEthernet'
import { ConnectViaUSB } from '../pages/OnDeviceDisplay/ConnectViaUSB'
import { ConnectViaWifi } from '../pages/OnDeviceDisplay/ConnectViaWifi'
import { NameRobot } from '../pages/OnDeviceDisplay/NameRobot'
import { NetworkSetupMenu } from '../pages/OnDeviceDisplay/NetworkSetupMenu'
import { ProtocolSetup } from '../pages/OnDeviceDisplay/ProtocolSetup'
import { TempODDMenu } from '../pages/OnDeviceDisplay/TempODDMenu'
import { RobotDashboard } from '../pages/OnDeviceDisplay/RobotDashboard'
import { RobotSettingsDashboard } from '../pages/OnDeviceDisplay/RobotSettingsDashboard'
import { ProtocolDashboard } from '../pages/OnDeviceDisplay/ProtocolDashboard'
import { ProtocolDetails } from '../pages/OnDeviceDisplay/ProtocolDetails'
import { UpdateRobot } from '../pages/OnDeviceDisplay/UpdateRobot'
import { AttachInstrumentsDashboard } from '../pages/OnDeviceDisplay/AttachInstrumentsDashboard'
import { Welcome } from '../pages/OnDeviceDisplay/Welcome'
import { PortalRoot as ModalPortalRoot } from './portal'
import { getOnDeviceDisplaySettings } from '../redux/config'
import { SLEEP_NEVER_MS } from './constants'

import type { RouteProps } from './types'

export const onDeviceDisplayRoutes: RouteProps[] = [
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
    Component: ConnectViaWifi,
    exact: true,
    name: 'Select Network',
    path: '/network-setup/wifi',
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
    Component: ProtocolDashboard,
    exact: true,
    name: 'All Protocols',
    navLinkTo: '/protocols',
    path: '/protocols',
  },
  // insert protocol subroutes
  {
    Component: ProtocolDetails,
    exact: true,
    name: 'Protocol Details',
    path: '/protocols/:protocolId',
  },
  // TODO(bh: 2022-12-5): these "protocol run" page are a rough guess based on existing designs and site map
  // expect to change or add additional route params
  {
    Component: ProtocolSetup,
    exact: true,
    name: 'Protocol Setup',
    path: '/protocols/:runId/setup',
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
    path: '/protocols/:runId/run',
  },
  {
    Component: AttachInstrumentsDashboard,
    exact: true,
    name: 'Instruments',
    navLinkTo: '/attach-instruments',
    path: '/attach-instruments',
  },
  // insert attach instruments subroutes
  {
    Component: RobotSettingsDashboard,
    exact: true,
    name: 'Settings',
    navLinkTo: '/robot-settings',
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
        <Box>app settings</Box>
      </>
    ),
    exact: true,
    name: 'App Settings',
    path: '/app-settings',
  },
]

const onDeviceDisplayEvents: Array<keyof DocumentEventMap> = [
  'mousedown',
  'click',
  'scroll',
]

export const OnDeviceDisplayApp = (): JSX.Element => {
  const { sleepMs } = useSelector(getOnDeviceDisplaySettings)
  const sleepTime = sleepMs != null ? sleepMs : SLEEP_NEVER_MS
  const options = {
    events: onDeviceDisplayEvents,
    initialState: false,
  }
  const isIdle = useIdle(sleepTime, options)

  return (
    <ApiHostProvider hostname="localhost">
      <Box width="100%">
        {Boolean(isIdle) ? (
          <SleepScreen />
        ) : (
          <ToasterOven>
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
              <Redirect exact from="/" to="/dashboard" />
            </Switch>
          </ToasterOven>
        )}
      </Box>
    </ApiHostProvider>
  )
}
