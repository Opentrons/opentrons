import * as React from 'react'
import { screen } from '@testing-library/react'
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '../../__testing-utils__'
import { i18n } from '../../i18n'
import { OnDeviceLocalizationProvider } from '../../LocalizationProvider'
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
import { EmergencyStop } from '../../pages/EmergencyStop'
import { DeckConfigurationEditor } from '../../pages/DeckConfiguration'
import { getOnDeviceDisplaySettings } from '../../redux/config'
import { getIsShellReady } from '../../redux/shell'
import { getLocalRobot } from '../../redux/discovery'
import { mockConnectedRobot } from '../../redux/discovery/__fixtures__'
import { useCurrentRunRoute, useProtocolReceiptToast } from '../hooks'
import { useNotifyCurrentMaintenanceRun } from '../../resources/maintenance_runs'

import type { UseQueryResult } from 'react-query'
import type { RobotSettingsResponse } from '@opentrons/api-client'
import type { OnDeviceLocalizationProviderProps } from '../../LocalizationProvider'
import type { OnDeviceDisplaySettings } from '../../redux/config/schema-types'

vi.mock('@opentrons/react-api-client', async () => {
  const actual = await vi.importActual('@opentrons/react-api-client')
  return {
    ...actual,
    useRobotSettingsQuery: () =>
      (({
        data: { settings: [] },
      } as unknown) as UseQueryResult<RobotSettingsResponse>),
  }
})
vi.mock('../../LocalizationProvider')
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
vi.mock('../../pages/EmergencyStop')
vi.mock('../../pages/DeckConfiguration')
vi.mock('../../redux/config')
vi.mock('../../redux/shell')
vi.mock('../../redux/discovery')
vi.mock('../../resources/maintenance_runs')
vi.mock('../hooks')

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
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue(mockSettings as any)
    vi.mocked(getIsShellReady).mockReturnValue(true)
    vi.mocked(useCurrentRunRoute).mockReturnValue(null)
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: 'test',
        },
      },
    } as any)
    // TODO(bh, 2024-03-27): implement testing of branded and anonymous i18n, but for now pass through
    vi.mocked(
      OnDeviceLocalizationProvider
    ).mockImplementation((props: OnDeviceLocalizationProviderProps) => (
      <>{props.children}</>
    ))
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders Welcome component from /welcome', () => {
    render('/welcome')
    expect(vi.mocked(Welcome)).toHaveBeenCalled()
  })
  it('renders NetworkSetupMenu component from /network-setup', () => {
    render('/network-setup')
    expect(vi.mocked(NetworkSetupMenu)).toHaveBeenCalled()
  })
  it('renders ConnectViaEthernet component from /network-setup/ethernet', () => {
    render('/network-setup/ethernet')
    expect(vi.mocked(ConnectViaEthernet)).toHaveBeenCalled()
  })
  it('renders ConnectViaUSB component from /network-setup/usb', () => {
    render('/network-setup/usb')
    expect(vi.mocked(ConnectViaUSB)).toHaveBeenCalled()
  })
  it('renders ConnectViaWifi component from /network-setup/wifi', () => {
    render('/network-setup/wifi')
    expect(vi.mocked(ConnectViaWifi)).toHaveBeenCalled()
  })
  it('renders RobotDashboard component from /dashboard', () => {
    render('/dashboard')
    expect(vi.mocked(RobotDashboard)).toHaveBeenCalled()
  })
  it('renders ProtocolDashboard component from /protocols', () => {
    render('/protocols')
    expect(vi.mocked(ProtocolDashboard)).toHaveBeenCalled()
  })
  it('renders ProtocolDetails component from /protocols/:protocolId/setup', () => {
    render('/protocols/my-protocol-id')
    expect(vi.mocked(ProtocolDetails)).toHaveBeenCalled()
  })
  it('renders RobotSettingsDashboard component from /robot-settings', () => {
    render('/robot-settings')
    expect(vi.mocked(RobotSettingsDashboard)).toHaveBeenCalled()
  })
  it('renders InstrumentsDashboard component from /instruments', () => {
    render('/instruments')
    expect(vi.mocked(InstrumentsDashboard)).toHaveBeenCalled()
  })
  it('when current run route present renders ProtocolSetup component from /runs/:runId/setup', () => {
    render('/runs/my-run-id/setup')
    expect(vi.mocked(ProtocolSetup)).toHaveBeenCalled()
  })
  it('when current run route present renders RunningProtocol component from /runs/:runId/run', () => {
    render('/runs/my-run-id/run')
    expect(vi.mocked(RunningProtocol)).toHaveBeenCalled()
  })
  it('when current run route present renders a RunSummary component from /runs/:runId/summary', () => {
    render('/runs/my-run-id/summary')
    expect(vi.mocked(RunSummary)).toHaveBeenCalled()
  })
  it('renders the localization provider and not the loading screen when app-shell is ready', () => {
    render('/')
    expect(vi.mocked(OnDeviceLocalizationProvider)).toHaveBeenCalled()
    expect(screen.queryByLabelText('loading indicator')).toBeNull()
  })
  it('renders the loading screen when app-shell is not ready', () => {
    vi.mocked(getIsShellReady).mockReturnValue(false)
    render('/')
    screen.getByLabelText('loading indicator')
    expect(vi.mocked(OnDeviceLocalizationProvider)).not.toHaveBeenCalled()
  })
  it('renders EmergencyStop component from /emergency-stop', () => {
    render('/emergency-stop')
    expect(vi.mocked(EmergencyStop)).toHaveBeenCalled()
  })
  it('renders DeckConfiguration component from /deck-configuration', () => {
    render('/deck-configuration')
    expect(vi.mocked(DeckConfigurationEditor)).toHaveBeenCalled()
  })
  it('renders DeckConfiguration component from /deck-configuration', () => {
    render('/robot-settings/rename-robot')
    expect(vi.mocked(NameRobot)).toHaveBeenCalled()
  })
  it('renders protocol receipt toasts', () => {
    render('/')
    expect(vi.mocked(useProtocolReceiptToast)).toHaveBeenCalled()
  })
})
