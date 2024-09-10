import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import { css } from 'styled-components'
import { ErrorBoundary } from 'react-error-boundary'

import {
  Box,
  COLORS,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
  useIdle,
  useScrolling,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import NiceModal from '@ebay/nice-modal-react'

import { SleepScreen } from '../atoms/SleepScreen'
import { OnDeviceLocalizationProvider } from '../LocalizationProvider'
import { ToasterOven } from '../organisms/ToasterOven'
import { MaintenanceRunTakeover } from '../organisms/TakeoverModal'
import { FirmwareUpdateTakeover } from '../organisms/FirmwareUpdateModal/FirmwareUpdateTakeover'
import { IncompatibleModuleTakeover } from '../organisms/IncompatibleModule'
import { EstopTakeover } from '../organisms/EmergencyStop'
import { ConnectViaEthernet } from '../pages/ConnectViaEthernet'
import { ConnectViaUSB } from '../pages/ConnectViaUSB'
import { ConnectViaWifi } from '../pages/ConnectViaWifi'
import { EmergencyStop } from '../pages/EmergencyStop'
import { NameRobot } from '../pages/NameRobot'
import { NetworkSetupMenu } from '../pages/NetworkSetupMenu'
import { ProtocolSetup } from '../pages/ODD/ProtocolSetup'
import { RobotDashboard } from '../pages/ODD/RobotDashboard'
import { RobotSettingsDashboard } from '../pages/ODD/RobotSettingsDashboard'
import { ProtocolDashboard } from '../pages/ODD/ProtocolDashboard'
import { ProtocolDetails } from '../pages/ODD/ProtocolDetails'
import { QuickTransferFlow } from '../organisms/QuickTransferFlow'
import { QuickTransferDashboard } from '../pages/ODD/QuickTransferDashboard'
import { QuickTransferDetails } from '../pages/ODD/QuickTransferDetails'
import { RunningProtocol } from '../pages/RunningProtocol'
import { RunSummary } from '../pages/RunSummary'
import { UpdateRobot } from '../pages/UpdateRobot/UpdateRobot'
import { UpdateRobotDuringOnboarding } from '../pages/UpdateRobot/UpdateRobotDuringOnboarding'
import { InstrumentsDashboard } from '../pages/ODD/InstrumentsDashboard'
import { InstrumentDetail } from '../pages/ODD/InstrumentDetail'
import { Welcome } from '../pages/Welcome'
import { InitialLoadingScreen } from '../pages/InitialLoadingScreen'
import { DeckConfigurationEditor } from '../pages/DeckConfiguration'
import { PortalRoot as ModalPortalRoot } from './portal'
import { getOnDeviceDisplaySettings, updateConfigValue } from '../redux/config'
import { updateBrightness } from '../redux/shell'
import { SLEEP_NEVER_MS } from './constants'
import { useProtocolReceiptToast, useSoftwareUpdatePoll } from './hooks'
import { ODDTopLevelRedirects } from './ODDTopLevelRedirects'

import { OnDeviceDisplayAppFallback } from './OnDeviceDisplayAppFallback'

import { hackWindowNavigatorOnLine } from './hacks'

import type { Dispatch } from '../redux/types'

// forces electron to think we're online which means axios won't elide
// network calls to localhost. see ./hacks.ts for more.
hackWindowNavigatorOnLine()

export const ON_DEVICE_DISPLAY_PATHS = [
  '/dashboard',
  '/deck-configuration',
  '/emergency-stop',
  '/instruments',
  '/instruments/:mount',
  '/network-setup',
  '/network-setup/ethernet',
  '/network-setup/usb',
  '/network-setup/wifi',
  '/protocols',
  '/protocols/:protocolId',
  '/quick-transfer',
  '/quick-transfer/new',
  '/quick-transfer/:quickTransferId',
  '/robot-settings',
  '/robot-settings/rename-robot',
  '/robot-settings/update-robot',
  '/robot-settings/update-robot-during-onboarding',
  '/runs/:runId/run',
  '/runs/:runId/setup',
  '/runs/:runId/summary',
  '/welcome',
] as const

function getPathComponent(
  path: typeof ON_DEVICE_DISPLAY_PATHS[number]
): JSX.Element {
  switch (path) {
    case '/dashboard':
      return <RobotDashboard />
    case '/deck-configuration':
      return <DeckConfigurationEditor />
    case '/emergency-stop':
      return <EmergencyStop />
    case '/instruments':
      return <InstrumentsDashboard />
    case '/instruments/:mount':
      return <InstrumentDetail />
    case '/network-setup':
      return <NetworkSetupMenu />
    case '/network-setup/ethernet':
      return <ConnectViaEthernet />
    case '/network-setup/usb':
      return <ConnectViaUSB />
    case '/network-setup/wifi':
      return <ConnectViaWifi />
    case '/protocols':
      return <ProtocolDashboard />
    case '/protocols/:protocolId':
      return <ProtocolDetails />
    case '/quick-transfer':
      return <QuickTransferDashboard />
    case '/quick-transfer/new':
      return <QuickTransferFlow />
    case '/quick-transfer/:quickTransferId':
      return <QuickTransferDetails />
    case '/robot-settings':
      return <RobotSettingsDashboard />
    case '/robot-settings/rename-robot':
      return <NameRobot />
    case '/robot-settings/update-robot':
      return <UpdateRobot />
    case '/robot-settings/update-robot-during-onboarding':
      return <UpdateRobotDuringOnboarding />
    case '/runs/:runId/run':
      return <RunningProtocol />
    case '/runs/:runId/setup':
      return <ProtocolSetup />
    case '/runs/:runId/summary':
      return <RunSummary />
    case '/welcome':
      return <Welcome />
  }
}

const onDeviceDisplayEvents: Array<keyof DocumentEventMap> = [
  'mousedown',
  'click',
  'scroll',
]

const TURN_OFF_BACKLIGHT = '7'

export const OnDeviceDisplayApp = (): JSX.Element => {
  useSoftwareUpdatePoll()
  const { brightness: userSetBrightness, sleepMs } = useSelector(
    getOnDeviceDisplaySettings
  )

  const sleepTime = sleepMs ?? SLEEP_NEVER_MS
  const options = {
    events: onDeviceDisplayEvents,
    initialState: false,
  }
  const dispatch = useDispatch<Dispatch>()
  const isIdle = useIdle(sleepTime, options)

  React.useEffect(() => {
    if (isIdle) {
      dispatch(updateBrightness(TURN_OFF_BACKLIGHT))
    } else {
      dispatch(
        updateConfigValue(
          'onDeviceDisplaySettings.brightness',
          userSetBrightness
        )
      )
    }
  }, [dispatch, isIdle, userSetBrightness])

  // TODO (sb:6/12/23) Create a notification manager to set up preference and order of takeover modals
  return (
    <ApiHostProvider hostname="127.0.0.1">
      <InitialLoadingScreen>
        <OnDeviceLocalizationProvider>
          <ErrorBoundary FallbackComponent={OnDeviceDisplayAppFallback}>
            <Box width="100%" css="user-select: none;">
              {isIdle ? (
                <SleepScreen />
              ) : (
                <>
                  <EstopTakeover />
                  <IncompatibleModuleTakeover isOnDevice={true} />
                  <MaintenanceRunTakeover>
                    <FirmwareUpdateTakeover />
                    <NiceModal.Provider>
                      <ToasterOven>
                        <ProtocolReceiptToasts />
                        <OnDeviceDisplayAppRoutes />
                      </ToasterOven>
                    </NiceModal.Provider>
                  </MaintenanceRunTakeover>
                </>
              )}
            </Box>
            <ODDTopLevelRedirects />
          </ErrorBoundary>
        </OnDeviceLocalizationProvider>
      </InitialLoadingScreen>
    </ApiHostProvider>
  )
}

const getTargetPath = (unfinishedUnboxingFlowRoute: string | null): string => {
  if (unfinishedUnboxingFlowRoute != null) {
    return unfinishedUnboxingFlowRoute
  }

  return '/dashboard'
}

// split to a separate function because scrollRef rerenders on every route change
// this avoids rerendering parent providers as well
export function OnDeviceDisplayAppRoutes(): JSX.Element {
  const [currentNode, setCurrentNode] = React.useState<null | HTMLElement>(null)
  const scrollRef = React.useCallback((node: HTMLElement | null) => {
    setCurrentNode(node)
  }, [])
  const isScrolling = useScrolling(currentNode)

  const { unfinishedUnboxingFlowRoute } = useSelector(
    getOnDeviceDisplaySettings
  )

  const targetPath = getTargetPath(unfinishedUnboxingFlowRoute)

  const TOUCH_SCREEN_STYLE = css`
    position: ${POSITION_RELATIVE};
    width: 100%;
    height: 100%;
    background-color: ${COLORS.white};
    overflow-y: ${OVERFLOW_AUTO};

    &::-webkit-scrollbar {
      display: block;
      width: 0.75rem;
    }

    &::-webkit-scrollbar-thumb {
      display: ${isScrolling ? 'block' : 'none'};
      background: ${COLORS.grey50};
      border-radius: 11px;
    }
  `

  return (
    <Routes>
      {ON_DEVICE_DISPLAY_PATHS.map(path => (
        <Route
          key={path}
          path={path}
          element={
            <Box css={TOUCH_SCREEN_STYLE} ref={scrollRef}>
              <ModalPortalRoot />
              {getPathComponent(path)}
            </Box>
          }
        />
      ))}
      {targetPath != null && (
        <Route path="*" element={<Navigate to={targetPath} replace />} />
      )}
    </Routes>
  )
}

function ProtocolReceiptToasts(): null {
  useProtocolReceiptToast()
  return null
}
