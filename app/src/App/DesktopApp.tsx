import * as React from 'react'
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom'

import {
  Box,
  COLORS,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import NiceModal from '@ebay/nice-modal-react'

import { Alerts } from '../organisms/Alerts'
import { Breadcrumbs } from '../organisms/Breadcrumbs'
import { ToasterOven } from '../organisms/ToasterOven'
import { CalibrationDashboard } from '../pages/Devices/CalibrationDashboard'
import { DeviceDetails } from '../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../pages/Devices/DevicesLanding'
import { ProtocolRunDetails } from '../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../pages/Devices/RobotSettings'
import { ProtocolsLanding } from '../pages/Protocols/ProtocolsLanding'
import { ProtocolDetails } from '../pages/Protocols/ProtocolDetails'
import { AppSettings } from '../pages/AppSettings'
import { Labware } from '../pages/Labware'
import { useSoftwareUpdatePoll } from './hooks'
import { Navbar } from './Navbar'
import { EstopTakeover, EmergencyStopContext } from '../organisms/EmergencyStop'
import { OPENTRONS_USB } from '../redux/discovery'
import { appShellRequestor } from '../redux/shell/remote'
import { useRobot, useIsFlex } from '../organisms/Devices/hooks'
import { ProtocolTimeline } from '../pages/Protocols/ProtocolDetails/ProtocolTimeline'
import { PortalRoot as ModalPortalRoot } from './portal'

import type { RouteProps, DesktopRouteParams  } from './types'

export const DesktopApp = (): JSX.Element => {
  useSoftwareUpdatePoll()
  const [
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
  ] = React.useState<boolean>(false)

  const desktopRoutes: RouteProps[] = [
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
      Component: ProtocolTimeline,
      exact: true,
      name: 'Protocol Timeline',
      path: '/protocols/:protocolKey/timeline',
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
      navLinkTo: '/devices',
      path: '/devices',
    },
    {
      Component: DeviceDetails,
      exact: true,
      name: 'Device',
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

  return (
    <NiceModal.Provider>
      <Navbar routes={desktopRoutes} />
      <ToasterOven>
        <EmergencyStopContext.Provider
          value={{
            isEmergencyStopModalDismissed,
            setIsEmergencyStopModalDismissed,
          }}
        >
          <Box width="100%">
            <Alerts>
              <Switch>
                {desktopRoutes.map(({ Component, exact, path }: RouteProps) => {
                  return (
                    <Route key={path} exact={exact} path={path}>
                      <Breadcrumbs />
                      <Box
                        position={POSITION_RELATIVE}
                        width="100%"
                        height="100%"
                        backgroundColor={COLORS.fundamentalsBackground}
                        overflow={OVERFLOW_AUTO}
                      >
                        <ModalPortalRoot />
                        <Component />
                      </Box>
                    </Route>
                  )
                })}
                <Redirect exact from="/" to="/protocols" />
              </Switch>
              <RobotControlTakeover />
            </Alerts>
          </Box>
        </EmergencyStopContext.Provider>
      </ToasterOven>
    </NiceModal.Provider>
  )
}

function RobotControlTakeover(): JSX.Element | null {
  const deviceRouteMatch = useRouteMatch({ path: '/devices/:robotName' })
  const params = deviceRouteMatch?.params as DesktopRouteParams
  const robotName = params?.robotName
  const robot = useRobot(robotName)
  const isFlex = useIsFlex(robotName)

  // E-stop is not supported on OT2
  if (!isFlex) return null

  if (deviceRouteMatch == null || robot == null || robotName == null)
    return null

  return (
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
    >
      <EstopTakeover robotName={robotName} />
    </ApiHostProvider>
  )
}
