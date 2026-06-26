import { useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import NiceModal from '@ebay/nice-modal-react'
import { css } from 'styled-components'

import {
  Box,
  COLORS,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
} from '@opentrons/components'
import {
  ApiHostContext,
  useAccessControlEnabledQuery,
  useRobotSettingsQuery,
} from '@opentrons/react-api-client'

import { ReactQueryDevtools } from '/app/App/tools'
import { SleepScreen } from '/app/atoms/SleepScreen'
import { SLEEP_NEVER_MS, useScreenIdle } from '/app/local-resources/dom-utils'
import { EstopTakeover } from '/app/organisms/EmergencyStop'
import { FirmwareUpdateTakeover } from '/app/organisms/FirmwareUpdateModal/FirmwareUpdateTakeover'
import { IncompatibleModuleTakeover } from '/app/organisms/IncompatibleModule'
import { ModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { LoggedOutOverlayMount } from '/app/organisms/ODD/OnDeviceLogin/LoggedOutOverlayMount'
import { QuickTransferFlow } from '/app/organisms/ODD/QuickTransferFlow'
import { RobotEncryptionKeyTakeover } from '/app/organisms/ODD/RobotSettingsDashboard/RobotEncryptionKey/RobotEncryptionKeyTakeover'
import { MaintenanceRunTakeover } from '/app/organisms/TakeoverModal'
import { ToasterOven } from '/app/organisms/ToasterOven'
import { Account } from '/app/pages/ODD/Account'
import { ChooseLanguage } from '/app/pages/ODD/ChooseLanguage'
import { ConnectViaEthernet } from '/app/pages/ODD/ConnectViaEthernet'
import { ConnectViaUSB } from '/app/pages/ODD/ConnectViaUSB'
import { ConnectViaWifi } from '/app/pages/ODD/ConnectViaWifi'
import { DeckConfigurationEditor } from '/app/pages/ODD/DeckConfiguration'
import { EmergencyStop } from '/app/pages/ODD/EmergencyStop'
import { InitialLoadingScreen } from '/app/pages/ODD/InitialLoadingScreen'
import { InstrumentDetail } from '/app/pages/ODD/InstrumentDetail'
import { InstrumentsDashboard } from '/app/pages/ODD/InstrumentsDashboard'
import { NetworkSetupMenu } from '/app/pages/ODD/NetworkSetupMenu'
import { ProtocolDashboard } from '/app/pages/ODD/ProtocolDashboard'
import { ProtocolDetails } from '/app/pages/ODD/ProtocolDetails'
import { ProtocolSetup } from '/app/pages/ODD/ProtocolSetup'
import { QuickTransferDetails } from '/app/pages/ODD/QuickTransferDetails'
import { RobotDashboard } from '/app/pages/ODD/RobotDashboard'
import { RobotNameEditor } from '/app/pages/ODD/RobotNameEditor'
import { RobotSettingsDashboard } from '/app/pages/ODD/RobotSettingsDashboard'
import { RunningProtocol } from '/app/pages/ODD/RunningProtocol'
import { RunSummary } from '/app/pages/ODD/RunSummary'
import { UpdateRobot } from '/app/pages/ODD/UpdateRobot/UpdateRobot'
import { UpdateRobotDuringOnboarding } from '/app/pages/ODD/UpdateRobot/UpdateRobotDuringOnboarding'
import { Welcome } from '/app/pages/ODD/Welcome'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '/app/redux/config'
import { getLocalRobot } from '/app/redux/discovery'
import { getIsShellReady, updateBrightness } from '/app/redux/shell'

import { DocumentationRequiredModalContext } from '../local-resources/access-control/DocumentationRequiredModalContext'
import { LocalizationProvider } from '../LocalizationProvider'
import { requireDocumentation } from '../organisms/ODD/DocumentationRequired/requireDocumentation'
import { showLoginModal } from '../organisms/ODD/OnDeviceLogin/LoginModal'
import { getLocalRobotAccessToken } from '../redux/robot-auth'
import { hackWindowNavigatorOnLine } from './hacks'
import {
  useModuleAttachedToast,
  useScrollRef,
} from './hooks/useModuleAttachedToast'
import { useProtocolReceiptToast } from './hooks/useProtocolReceiptToast'
import { useRefreshAccessTokenOnActivity } from './hooks/useRefreshAccessTokenOnActivity'
import { useSoftwareUpdatePoll } from './hooks/useSoftwareUpdatePoll'
import { SharedScrollRefProvider } from './ODDProviders/ScrollRefProvider'
import { ODDTopLevelRedirects } from './ODDTopLevelRedirects'
import { OnDeviceDisplayAppFallback } from './OnDeviceDisplayAppFallback'
import { ModalPortalRoot } from './portal'

import type { HostConfig } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

// forces electron to think we're online which means axios won't elide
// network calls to localhost. see ./hacks.ts for more.
hackWindowNavigatorOnLine()

export const ON_DEVICE_DISPLAY_PATHS = [
  '/account',
  '/choose-language',
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
  path: (typeof ON_DEVICE_DISPLAY_PATHS)[number]
): JSX.Element {
  switch (path) {
    case '/account':
      return <Account />
    case '/choose-language':
      return <ChooseLanguage />
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
    case '/quick-transfer/new':
      return <QuickTransferFlow />
    case '/quick-transfer/:quickTransferId':
      return <QuickTransferDetails />
    case '/robot-settings':
      return <RobotSettingsDashboard />
    case '/robot-settings/rename-robot':
      return <RobotNameEditor />
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

const TURN_OFF_BACKLIGHT = '7'

const RETRY_DELAY_MS = 1000

export const OnDeviceDisplayApp = (): JSX.Element => {
  const dispatch = useDispatch<Dispatch>()

  const [showModuleSetupModal, setShowModuleSetupModal] = useState(false)

  useSoftwareUpdatePoll()

  // Normally, our hooks get the HostConfig from the nearest ApiHostProvider context.
  // But here at the app root, that doesn't exist. So we need to make sure we pass this
  // override into all the hooks in this component that will try to use the robot API.
  const localRobot = useSelector(getLocalRobot)
  const accessToken = useSelector(getLocalRobotAccessToken)
  const hostConfig = useMemo<HostConfig>(
    () => ({
      hostname: _ODD_IP_ ?? 'localhost',
      token: accessToken,
      port: localRobot?.port ?? null,
    }),
    [accessToken, localRobot?.port]
  )

  const { brightness: userSetBrightness, sleepMs } = useSelector(
    getOnDeviceDisplaySettings
  )
  const sleepTime = sleepMs ?? SLEEP_NEVER_MS
  const isIdle = useScreenIdle(sleepTime, { initialState: false })
  useEffect(() => {
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

  useRefreshAccessTokenOnActivity()

  const isShellReady = useSelector(getIsShellReady)

  const robotSettingsQuery = useRobotSettingsQuery(
    {
      retry: true,
      retryDelay: RETRY_DELAY_MS,
    },
    hostConfig
  )

  const accessControlEnabledQuery = useAccessControlEnabledQuery(
    {
      retry: true,
      retryDelay: RETRY_DELAY_MS,
    },
    hostConfig
  )

  const isReady =
    // ensure robot-server api, etc. is up and running
    isShellReady &&
    // ensure settings query data is available for localization provider
    robotSettingsQuery.isSuccess &&
    // ensure we know whether access control is enabled or not,
    // so on first render we can immediately show the LoggedOutOverlay, if appropriate.
    accessControlEnabledQuery.isSuccess

  // TODO (sb:6/12/23) Create a notification manager to set up preference and order of takeover modals
  return (
    // to make sure that the host config stays stable and in step with the initial queries,
    // we use an ApiHostContext.Provider here instead of an ApiHostProvider.
    <ApiHostContext.Provider value={hostConfig}>
      <ReactQueryDevtools />
      {isReady ? (
        <LocalizationProvider>
          <ErrorBoundary FallbackComponent={OnDeviceDisplayAppFallback}>
            <Box width="100%" css="user-select: none;">
              {isIdle ? (
                <SleepScreen />
              ) : (
                <>
                  <IncompatibleModuleTakeover isOnDevice={true} />
                  <DocumentationRequiredModalContext.Provider
                    value={{
                      showDocumentationRequiredModal: requireDocumentation,
                      showLoginModal,
                    }}
                  >
                    <MaintenanceRunTakeover>
                      <EstopTakeover />
                      <FirmwareUpdateTakeover />
                      {showModuleSetupModal && localRobot?.name != null ? (
                        <ModuleWizardFlows
                          showSetupLauncher={true}
                          closeFlow={() => {
                            setShowModuleSetupModal(false)
                          }}
                          robotName={localRobot.name}
                        />
                      ) : null}

                      <NiceModal.Provider>
                        <RobotEncryptionKeyTakeover>
                          <ToasterOven>
                            <ProtocolReceiptToasts />
                            {!showModuleSetupModal ? (
                              <ModuleAttachedToasts
                                openFlow={(open: boolean) => {
                                  setShowModuleSetupModal(open)
                                }}
                              />
                            ) : null}

                            <SharedScrollRefProvider>
                              <OnDeviceDisplayAppRoutes />
                            </SharedScrollRefProvider>
                            <LoggedOutOverlayMount />
                          </ToasterOven>
                        </RobotEncryptionKeyTakeover>
                      </NiceModal.Provider>
                    </MaintenanceRunTakeover>
                  </DocumentationRequiredModalContext.Provider>
                </>
              )}
            </Box>
            <ODDTopLevelRedirects />
          </ErrorBoundary>
        </LocalizationProvider>
      ) : (
        <InitialLoadingScreen />
      )}
    </ApiHostContext.Provider>
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
  const { isScrolling, refCallback, element } = useScrollRef()
  const location = useLocation()
  useEffect(
    () => {
      element?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname]
  )

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
            <Box css={TOUCH_SCREEN_STYLE} ref={refCallback}>
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

function ModuleAttachedToasts({
  openFlow,
}: {
  openFlow: (open: boolean) => void
}): null {
  useModuleAttachedToast(openFlow)
  return null
}
