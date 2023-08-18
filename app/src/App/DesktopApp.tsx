import * as React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import {
  Box,
  POSITION_RELATIVE,
  COLORS,
  OVERFLOW_AUTO,
} from '@opentrons/components'

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
import { PortalRoot as ModalPortalRoot } from './portal'

import type { RouteProps } from './types'

export const DesktopApp = (): JSX.Element => {
  useSoftwareUpdatePoll()

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
    <>
      <Navbar routes={desktopRoutes} />
      <ToasterOven>
        <Box width="100%">
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
          <Alerts />
        </Box>
      </ToasterOven>
    </>
  )
}
