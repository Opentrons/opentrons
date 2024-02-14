import * as React from 'react'
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '../../__testing-utils__'
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

vi.mock('../../pages/Welcome')
vi.mock('../../pages/NetworkSetupMenu')
vi.mock('../../pages/ConnectViaEthernet')
vi.mock('../../pages/ConnectViaUSB')
vi.mock('../../pages/ConnectViaWifi')
vi.mock('../../pages/RobotDashboard')
vi.mock('../../pages/RobotSettingsDashboard')
vi.mock('../../pages/ProtocolDashboard')
vi.mock('../../pages/ProtocolSetup')
vi.mock('../../pages/ProtocolDetails')
vi.mock('../../pages/InstrumentsDashboard')
vi.mock('../../pages/RunningProtocol')
vi.mock('../../pages/RunSummary')
vi.mock('../../pages/NameRobot')
vi.mock('../../pages/InitialLoadingScreen')
vi.mock('../../pages/EmergencyStop')
vi.mock('../../pages/DeckConfiguration')
vi.mock('../../redux/config')
vi.mock('../../redux/shell')
vi.mock('../../redux/discovery')
vi.mock('../hooks')
vi.mock('../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun')

const mockSettings = {
  sleepMs: 60 * 1000 * 60 * 24 * 7,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: '/welcome',
} as OnDeviceDisplaySettings

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
    vi.mocked(InstrumentsDashboard).mockReturnValue(
      <div>Mock InstrumentsDashboard</div>
    )
    vi.mocked(Welcome).mockReturnValue(<div>Mock Welcome</div>)
    vi.mocked(NetworkSetupMenu).mockReturnValue(<div>Mock NetworkSetupMenu</div>)
    vi.mocked(ConnectViaEthernet).mockReturnValue(<div>Mock ConnectViaEthernet</div>)
    vi.mocked(ConnectViaUSB).mockReturnValue(<div>Mock ConnectViaUSB</div>) 
    vi.mocked(ConnectViaWifi).mockReturnValue(<div>Mock ConnectViaWifi</div>)
    vi.mocked(ProtocolDashboard).mockReturnValue(<div>Mock ProtocolDashboard</div>)
    vi.mocked(ProtocolSetup).mockReturnValue(<div>Mock ProtocolSetup</div>)
    vi.mocked(ProtocolDetails).mockReturnValue(<div>Mock ProtocolDetails</div>)
    vi.mocked(RobotSettingsDashboard).mockReturnValue(
      <div>Mock RobotSettingsDashboard</div>
    )
    vi.mocked(RunningProtocol).mockReturnValue(<div>Mock RunningProtocol</div>)
    vi.mocked(RunSummary).mockReturnValue(<div>Mock RunSummary</div>)
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue(mockSettings as any)
    vi.mocked(getIsShellReady).mockReturnValue(false)
    vi.mocked(RobotDashboard).mockReturnValue(<div>Mock RobotDashboard</div>)
    vi.mocked(NameRobot).mockReturnValue(<div>Mock NameRobot</div>)
    vi.mocked(InitialLoadingScreen).mockReturnValue(<div>Mock Loading</div>)
    vi.mocked(EmergencyStop).mockReturnValue(<div>Mock EmergencyStop</div>)
    vi.mocked(DeckConfigurationEditor).mockReturnValue(
      <div>Mock DeckConfiguration</div>
    )
    vi.mocked(useCurrentRunRoute).mockReturnValue(null)
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: 'test',
        },
      },
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it.only('renders Welcome component from /welcome', () => {
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
    vi.mocked(useCurrentRunRoute).mockReturnValue('/runs/my-run-id/setup')
    render('/runs/my-run-id/setup')
    screen.getByText('Mock ProtocolSetup')
  })
  it('when current run route present renders RunningProtocol component from /runs/:runId/run', () => {
    vi.mocked(useCurrentRunRoute).mockReturnValue('/runs/my-run-id/run')
    render('/runs/my-run-id/run')
    screen.getByText('Mock RunningProtocol')
  })
  it('when current run route present renders a RunSummary component from /runs/:runId/summary', () => {
    vi.mocked(useCurrentRunRoute).mockReturnValue('/runs/my-run-id/summary')
    render('/runs/my-run-id/summary')
    screen.getByText('Mock RunSummary')
  })
  it('renders the loading screen on mount', () => {
    render('/')
    vi.mocked(getIsShellReady).mockReturnValue(true)
    screen.getByText('Mock Loading')
  })
  it('renders EmergencyStop component from /emergency-stop', () => {
    vi.mocked(useCurrentRunRoute).mockReturnValue('/emergency-stop')
    render('/emergency-stop')
    screen.getByText('Mock EmergencyStop')
  })
  it('renders DeckConfiguration component from /deck-configuration', () => {
    vi.mocked(useCurrentRunRoute).mockReturnValue('/deck-configuration')
    render('/deck-configuration')
    screen.getByText('Mock DeckConfiguration')
  })
  it('renders protocol receipt toasts', () => {
    render('/')
    expect(vi.mocked(useProtocolReceiptToast)).toHaveBeenCalled()
  })
})
