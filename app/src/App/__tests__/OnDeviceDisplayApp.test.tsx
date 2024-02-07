import * as React from 'react'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { ConnectViaEthernet } from '../../pages/ConnectViaEthernet'
import { ConnectViaUSB } from '../../pages/ConnectViaUSB'
import { ConnectViaWifi } from '../../pages/ConnectViaWifi'
import { NetworkSetupMenu } from '../../pages/NetworkSetupMenu'
import { InstrumentsDashboard } from '../../pages/InstrumentsDashboard'
import { RobotDashboard } from '../../pages/RobotDashboard'
import { RobotSettingsDashboard } from '../../pages/RobotSettingsDashboard'
import { ProtocolDashboard } from '../../pages/ProtocolDashboard'
import { ProtocolSetup } from '../../pages/ProtocolSetup'
import { ProtocolDetails } from '../../pages/ProtocolDetails'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'
import { RunningProtocol } from '../../pages/RunningProtocol'
import { RunSummary } from '../../pages/RunSummary'
import { Welcome } from '../../pages/Welcome'
import { NameRobot } from '../../pages/NameRobot'
import { InitialLoadingScreen } from '../../pages/InitialLoadingScreen'
import { EmergencyStop } from '../../pages/EmergencyStop'
import { DeckConfigurationEditor } from '../../pages/DeckConfiguration'
import { getOnDeviceDisplaySettings } from '../../redux/config'
import { getIsShellReady } from '../../redux/shell'
import { getLocalRobot } from '../../redux/discovery'
import { mockConnectedRobot } from '../../redux/discovery/__fixtures__'
import { useCurrentRunRoute, useProtocolReceiptToast } from '../hooks'
import { useNotifyCurrentMaintenanceRun } from '../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun'

import type { OnDeviceDisplaySettings } from '../../redux/config/types'

jest.mock('../../pages/Welcome')
jest.mock('../../pages/NetworkSetupMenu')
jest.mock('../../pages/ConnectViaEthernet')
jest.mock('../../pages/ConnectViaUSB')
jest.mock('../../pages/ConnectViaWifi')
jest.mock('../../pages/RobotDashboard')
jest.mock('../../pages/RobotSettingsDashboard')
jest.mock('../../pages/ProtocolDashboard')
jest.mock('../../pages/ProtocolSetup')
jest.mock('../../pages/ProtocolDetails')
jest.mock('../../pages/InstrumentsDashboard')
jest.mock('../../pages/RunningProtocol')
jest.mock('../../pages/RunSummary')
jest.mock('../../pages/NameRobot')
jest.mock('../../pages/InitialLoadingScreen')
jest.mock('../../pages/EmergencyStop')
jest.mock('../../pages/DeckConfiguration')
jest.mock('../../redux/config')
jest.mock('../../redux/shell')
jest.mock('../../redux/discovery')
jest.mock('../hooks')
jest.mock('../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun')

const mockSettings = {
  sleepMs: 60 * 1000 * 60 * 24 * 7,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: '/welcome',
} as OnDeviceDisplaySettings

const mockWelcome = Welcome as jest.MockedFunction<typeof Welcome>
const mockNetworkSetupMenu = NetworkSetupMenu as jest.MockedFunction<
  typeof NetworkSetupMenu
>
const mockConnectViaEthernet = ConnectViaEthernet as jest.MockedFunction<
  typeof ConnectViaWifi
>
const mockConnectViaUSB = ConnectViaUSB as jest.MockedFunction<
  typeof ConnectViaUSB
>
const mockInitialLoadingScreen = InitialLoadingScreen as jest.MockedFunction<
  typeof InitialLoadingScreen
>
const mockConnectViaWifi = ConnectViaWifi as jest.MockedFunction<
  typeof ConnectViaWifi
>
const mockRobotDashboard = RobotDashboard as jest.MockedFunction<
  typeof RobotDashboard
>
const mockProtocolDashboard = ProtocolDashboard as jest.MockedFunction<
  typeof ProtocolDashboard
>
const mockProtocolDetails = ProtocolDetails as jest.MockedFunction<
  typeof ProtocolDetails
>
const mockProtocolSetup = ProtocolSetup as jest.MockedFunction<
  typeof ProtocolSetup
>
const mockRobotSettingsDashboard = RobotSettingsDashboard as jest.MockedFunction<
  typeof RobotSettingsDashboard
>
const mockInstrumentsDashboard = InstrumentsDashboard as jest.MockedFunction<
  typeof InstrumentsDashboard
>
const mockRunningProtocol = RunningProtocol as jest.MockedFunction<
  typeof RunningProtocol
>
const mockRunSummary = RunSummary as jest.MockedFunction<typeof RunSummary>
const mockNameRobot = NameRobot as jest.MockedFunction<typeof NameRobot>
const mockEmergencyStop = EmergencyStop as jest.MockedFunction<
  typeof EmergencyStop
>
const mockDeckConfigurationEditor = DeckConfigurationEditor as jest.MockedFunction<
  typeof DeckConfigurationEditor
>
const mockGetOnDeviceDisplaySettings = getOnDeviceDisplaySettings as jest.MockedFunction<
  typeof getOnDeviceDisplaySettings
>
const mockgetIsShellReady = getIsShellReady as jest.MockedFunction<
  typeof getIsShellReady
>
const mockUseCurrentRunRoute = useCurrentRunRoute as jest.MockedFunction<
  typeof useCurrentRunRoute
>
const mockUseProtocolReceiptToasts = useProtocolReceiptToast as jest.MockedFunction<
  typeof useProtocolReceiptToast
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockUseNotifyMaintenanceRun = useNotifyCurrentMaintenanceRun as jest.MockedFunction<
  typeof useNotifyCurrentMaintenanceRun
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <OnDeviceDisplayApp />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('OnDeviceDisplayApp', () => {
  beforeEach(() => {
    mockInstrumentsDashboard.mockReturnValue(
      <div>Mock InstrumentsDashboard</div>
    )
    mockWelcome.mockReturnValue(<div>Mock Welcome</div>)
    mockNetworkSetupMenu.mockReturnValue(<div>Mock NetworkSetupMenu</div>)
    mockConnectViaEthernet.mockReturnValue(<div>Mock ConnectViaEthernet</div>)
    mockConnectViaUSB.mockReturnValue(<div>Mock ConnectViaUSB</div>)
    mockConnectViaWifi.mockReturnValue(<div>Mock ConnectViaWifi</div>)
    mockRobotDashboard.mockReturnValue(<div>Mock RobotDashboard</div>)
    mockProtocolDashboard.mockReturnValue(<div>Mock ProtocolDashboard</div>)
    mockProtocolSetup.mockReturnValue(<div>Mock ProtocolSetup</div>)
    mockProtocolDetails.mockReturnValue(<div>Mock ProtocolDetails</div>)
    mockRobotSettingsDashboard.mockReturnValue(
      <div>Mock RobotSettingsDashboard</div>
    )
    mockRunningProtocol.mockReturnValue(<div>Mock RunningProtocol</div>)
    mockRunSummary.mockReturnValue(<div>Mock RunSummary</div>)
    mockGetOnDeviceDisplaySettings.mockReturnValue(mockSettings as any)
    mockgetIsShellReady.mockReturnValue(false)
    mockNameRobot.mockReturnValue(<div>Mock NameRobot</div>)
    mockInitialLoadingScreen.mockReturnValue(<div>Mock Loading</div>)
    mockEmergencyStop.mockReturnValue(<div>Mock EmergencyStop</div>)
    mockDeckConfigurationEditor.mockReturnValue(
      <div>Mock DeckConfiguration</div>
    )
    mockUseCurrentRunRoute.mockReturnValue(null)
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
    mockUseNotifyMaintenanceRun.mockReturnValue({
      data: {
        data: {
          id: 'test',
        },
      },
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders Welcome component from /welcome', () => {
    render('/welcome')
    screen.getByText('Mock Welcome')
  })

  it('renders NetworkSetupMenu component from /network-setup', () => {
    render('/network-setup')
    screen.getByText('Mock NetworkSetupMenu')
  })

  it('renders ConnectViaEthernet component from /network-setup/ethernet', () => {
    render('/network-setup/ethernet')
    screen.getByText('Mock ConnectViaEthernet')
  })

  it('renders ConnectViaUSB component from /network-setup/usb', () => {
    render('/network-setup/usb')
    screen.getByText('Mock ConnectViaUSB')
  })

  it('renders ConnectViaWifi component from /network-setup/wifi', () => {
    render('/network-setup/wifi')
    screen.getByText('Mock ConnectViaWifi')
  })

  it('renders RobotDashboard component from /dashboard', () => {
    render('/dashboard')
    screen.getByText('Mock RobotDashboard')
  })
  it('renders ProtocolDashboard component from /protocols', () => {
    render('/protocols')
    screen.getByText('Mock ProtocolDashboard')
  })
  it('renders ProtocolDetails component from /protocols/:protocolId/setup', () => {
    render('/protocols/my-protocol-id')
    screen.getByText('Mock ProtocolDetails')
  })

  it('renders RobotSettingsDashboard component from /robot-settings', () => {
    render('/robot-settings')
    screen.getByText('Mock RobotSettingsDashboard')
  })
  it('renders InstrumentsDashboard component from /instruments', () => {
    render('/instruments')
    screen.getByText('Mock InstrumentsDashboard')
  })
  it('when current run route present renders ProtocolSetup component from /runs/:runId/setup', () => {
    mockUseCurrentRunRoute.mockReturnValue('/runs/my-run-id/setup')
    render('/runs/my-run-id/setup')
    screen.getByText('Mock ProtocolSetup')
  })
  it('when current run route present renders RunningProtocol component from /runs/:runId/run', () => {
    mockUseCurrentRunRoute.mockReturnValue('/runs/my-run-id/run')
    render('/runs/my-run-id/run')
    screen.getByText('Mock RunningProtocol')
  })
  it('when current run route present renders a RunSummary component from /runs/:runId/summary', () => {
    mockUseCurrentRunRoute.mockReturnValue('/runs/my-run-id/summary')
    render('/runs/my-run-id/summary')
    screen.getByText('Mock RunSummary')
  })
  it('renders the loading screen on mount', () => {
    render('/')
    mockgetIsShellReady.mockReturnValue(true)
    screen.getByText('Mock Loading')
  })
  it('renders EmergencyStop component from /emergency-stop', () => {
    mockUseCurrentRunRoute.mockReturnValue('/emergency-stop')
    render('/emergency-stop')
    screen.getByText('Mock EmergencyStop')
  })
  it('renders DeckConfiguration component from /deck-configuration', () => {
    mockUseCurrentRunRoute.mockReturnValue('/deck-configuration')
    render('/deck-configuration')
    screen.getByText('Mock DeckConfiguration')
  })
  it('renders protocol receipt toasts', () => {
    render('/')
    expect(mockUseProtocolReceiptToasts).toHaveBeenCalled()
  })
})
