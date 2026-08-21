import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Route, Routes, useMatch } from 'react-router-dom'
import NiceModal from '@ebay/nice-modal-react'

import {
  Box,
  COLORS,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
} from '@opentrons/components'

import { LocalizationProvider } from '/app/LocalizationProvider'
import { Alerts } from '/app/organisms/Desktop/Alerts'
import { Breadcrumbs } from '/app/organisms/Desktop/Breadcrumbs'
import { SystemLanguagePreferenceModal } from '/app/organisms/Desktop/SystemLanguagePreferenceModal'
import {
  EmergencyStopContext,
  EstopTakeover,
} from '/app/organisms/EmergencyStop'
import { IncompatibleModuleTakeover } from '/app/organisms/IncompatibleModule'
import { ToasterOven } from '/app/organisms/ToasterOven'
import { AppSettings } from '/app/pages/Desktop/AppSettings'
import { CalibrationDashboard } from '/app/pages/Desktop/Devices/CalibrationDashboard'
import { DeviceDetails } from '/app/pages/Desktop/Devices/DeviceDetails'
import { DevicesLanding } from '/app/pages/Desktop/Devices/DevicesLanding'
import { ProtocolRunDetails } from '/app/pages/Desktop/Devices/ProtocolRunDetails'
import { RobotSettings } from '/app/pages/Desktop/Devices/RobotSettings'
import { Labware } from '/app/pages/Desktop/Labware'
import { ProtocolDetails } from '/app/pages/Desktop/Protocols/ProtocolDetails'
import { ProtocolsLanding } from '/app/pages/Desktop/Protocols/ProtocolsLanding'
import { useIsFlex } from '/app/redux-resources/robots'
import { useTrackRobotRestarts } from '/app/resources/devices/hooks/useTrackRobotRestarts'
import { RobotUpdateProvider } from '/app/resources/robot-update/RobotUpdateProvider'

import { DocumentationRequiredModalContext } from '../local-resources/access-control/DocumentationRequiredModalContext'
import { ApiHostProvider } from '../local-resources/api-host-provider/ApiHostProvider'
import { showDocumentationRequiredModal } from '../organisms/Desktop/DocumentationRequired/DocumentationRequiredModal'
import { showDownloadLogsModal } from '../organisms/Desktop/DownloadAuditLogsModal'
import { showLoginModal } from '../organisms/Desktop/LoginModal'
import { showSignRunModal } from '../organisms/Desktop/SignRunModal/SignRun'
import { ProtocolVisualization } from '../pages/Desktop/Protocols/ProtocolVisualization'
import { DesktopAppFallback } from './DesktopAppFallback'
import { useRefreshAccessTokenOnActivity } from './hooks/useRefreshAccessTokenOnActivity'
import { useSoftwareUpdatePoll } from './hooks/useSoftwareUpdatePoll'
import { Navbar } from './Navbar'
import { ModalPortalRoot } from './portal'
import { ReactQueryDevtools } from './tools'

import type { RouteProps } from './types'

export const DesktopApp = (): JSX.Element => {
  useSoftwareUpdatePoll()
  useRefreshAccessTokenOnActivity()
  useTrackRobotRestarts()
  const [isEmergencyStopModalDismissed, setIsEmergencyStopModalDismissed] =
    useState<boolean>(false)

  const desktopRoutes: RouteProps[] = [
    {
      Component: ProtocolsLanding,
      name: 'protocols',
      navLinkTo: '/protocols',
      path: '/protocols',
    },
    {
      Component: ProtocolDetails,
      name: 'Protocol Details',
      path: '/protocols/:protocolKey',
    },
    {
      Component: ProtocolVisualization,
      name: 'Visualization',
      path: '/protocols/:protocolKey/visualization',
    },
    {
      Component: Labware,
      name: 'labware',
      navLinkTo: '/labware',
      path: '/labware',
    },
    {
      Component: DevicesLanding,
      name: 'devices',
      navLinkTo: '/devices',
      path: '/devices',
    },
    {
      Component: DeviceDetails,
      name: 'Device',
      path: '/devices/:robotName/:deviceDetailsTab?',
    },
    {
      Component: CalibrationDashboard,
      name: 'Calibration Dashboard',
      path: '/devices/:robotName/robot-settings/calibration/dashboard',
    },
    {
      Component: RobotSettings,
      name: 'Robot Settings',
      path: '/devices/:robotName/robot-settings/:robotSettingsTab?',
    },
    {
      Component: ProtocolVisualization,
      name: 'Visualization',
      path: '/devices/:robotName/protocol-runs/:runId/:runCreatedAtTimestamp/:protocolKey/visualization',
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
    <LocalizationProvider>
      <DocumentationRequiredModalContext.Provider
        value={{
          showDocumentationRequiredModal,
          showLoginModal,
          showSignRunModal,
          showDownloadLogsModal,
        }}
      >
        <RobotUpdateProvider>
          <NiceModal.Provider>
            <ErrorBoundary FallbackComponent={DesktopAppFallback}>
              <ReactQueryDevtools />
              <SystemLanguagePreferenceModal />
              <Navbar routes={desktopRoutes} />
              <ToasterOven>
                <EmergencyStopContext.Provider
                  value={{
                    isEmergencyStopModalDismissed,
                    setIsEmergencyStopModalDismissed,
                  }}
                >
                  <Box width="100%" height="100vh">
                    <Alerts>
                      <Routes>
                        {desktopRoutes.map(
                          ({ Component, path }: RouteProps) => {
                            return (
                              <Route
                                key={path}
                                element={
                                  <Box
                                    key={Component.name}
                                    display="flex"
                                    flexDirection="column"
                                    height="100%"
                                  >
                                    <Breadcrumbs />
                                    <Box
                                      position={POSITION_RELATIVE}
                                      width="100%"
                                      flex="1"
                                      minHeight="0"
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
                                  </Box>
                                }
                                path={path}
                              />
                            )
                          }
                        )}
                        <Route
                          path="*"
                          element={<Navigate to="/protocols" />}
                        />
                      </Routes>
                      <RobotControlTakeover />
                    </Alerts>
                  </Box>
                </EmergencyStopContext.Provider>
              </ToasterOven>
            </ErrorBoundary>
          </NiceModal.Provider>
        </RobotUpdateProvider>
      </DocumentationRequiredModalContext.Provider>
    </LocalizationProvider>
  )
}

function RobotControlTakeover(): JSX.Element | null {
  const deviceRouteMatch = useMatch('/devices/:robotName/*')
  const params = deviceRouteMatch?.params
  const robotName = params?.robotName ?? null
  if (robotName == null) {
    return null
  }

  return (
    <ApiHostProvider key={robotName} robotName={robotName}>
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
