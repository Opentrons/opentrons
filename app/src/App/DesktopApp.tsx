import * as React from 'react'
import { Navigate, Route, Routes, useMatch } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { I18nextProvider } from 'react-i18next'

import {
  Box,
  COLORS,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import NiceModal from '@ebay/nice-modal-react'

import { i18n } from '../i18n'
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
import { IncompatibleModuleTakeover } from '../organisms/IncompatibleModule'
import { OPENTRONS_USB } from '../redux/discovery'
import { appShellRequestor } from '../redux/shell/remote'
import { useRobot, useIsFlex } from '../organisms/Devices/hooks'
import { ProtocolTimeline } from '../pages/Protocols/ProtocolDetails/ProtocolTimeline'
import { PortalRoot as ModalPortalRoot } from './portal'
import { DesktopAppFallback } from './DesktopAppFallback'

import type { RouteProps, DesktopRouteParams } from './types'

export const DesktopApp = (): JSX.Element => {
  useSoftwareUpdatePoll()
  const [
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
  ] = React.useState<boolean>(false)

  const desktopRoutes: RouteProps[] = [
    {
      Component: ProtocolsLanding,
      name: 'Protocols',
      navLinkTo: '/protocols',
      path: '/protocols',
    },
    {
      Component: ProtocolDetails,
      name: 'Protocol Details',
      path: '/protocols/:protocolKey',
    },
    {
      Component: ProtocolTimeline,
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
      name: 'Devices',
      navLinkTo: '/devices',
      path: '/devices',
    },
    {
      Component: DeviceDetails,
      name: 'Device',
      path: '/devices/:robotName',
    },
    {
      Component: RobotSettings,
      name: 'Robot Settings',
      path: '/devices/:robotName/robot-settings/:robotSettingsTab?',
    },
    {
      Component: CalibrationDashboard,
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
      name: 'App Settings',
      path: '/app-settings/:appSettingsTab?',
    },
  ]

  return (
    <NiceModal.Provider>
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary FallbackComponent={DesktopAppFallback}>
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
                  <Routes>
                    {desktopRoutes.map(({ Component, path }: RouteProps) => {
                      return (
                        <Route
                          key={path}
                          element={
                            <React.Fragment key={Component.name}>
                              <Breadcrumbs />
                              <Box
                                position={POSITION_RELATIVE}
                                width="100%"
                                height="100%"
                              >
                                <Box
                                  width="100%"
                                  height="100%"
                                  backgroundColor={COLORS.grey10}
                                  overflow={OVERFLOW_AUTO}
                                >
                                  <ModalPortalRoot />
                                  <Component />
                                </Box>
                              </Box>
                            </React.Fragment>
                          }
                          path={path}
                        />
                      )
                    })}
                    <Route path="*" element={<Navigate to="/protocols" />} />
                  </Routes>
                  <RobotControlTakeover />
                </Alerts>
              </Box>
            </EmergencyStopContext.Provider>
          </ToasterOven>
        </ErrorBoundary>
      </I18nextProvider>
    </NiceModal.Provider>
  )
}

function RobotControlTakeover(): JSX.Element | null {
  const deviceRouteMatch = useMatch('/devices/:robotName/*')
  const params = deviceRouteMatch?.params
  const robotName = params?.robotName ?? null
  const robot = useRobot(robotName)
  if (deviceRouteMatch == null || robot == null || robotName == null)
    return null

  return (
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
    >
      <FlexOnlyRobotControlTakeover robotName={robotName} />
      <AllRobotsRobotControlTakeover robotName={robotName} />
    </ApiHostProvider>
  )
}

interface TakeoverProps {
  robotName: string
}

function AllRobotsRobotControlTakeover({
  robotName,
}: TakeoverProps): JSX.Element | null {
  return <IncompatibleModuleTakeover isOnDevice={false} robotName={robotName} />
}

function FlexOnlyRobotControlTakeover({
  robotName,
}: TakeoverProps): JSX.Element | null {
  // E-stop is not supported on OT2
  const isFlex = useIsFlex(robotName)
  if (!isFlex) {
    return null
  }
  return <EstopTakeover robotName={robotName} />
}
