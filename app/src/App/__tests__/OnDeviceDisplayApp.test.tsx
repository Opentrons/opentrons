import * as React from 'react'
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest'
import { screen, cleanup, logRoles } from '@testing-library/react'
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
import { useMostRecentRunId } from '../../organisms/ProtocolUpload/hooks/useMostRecentRunId'
import { useNotifyRunQuery } from '../../resources/runs/useNotifyRunQuery'
import * as ReactApiClient from '@opentrons/react-api-client'
import { useRobotAnalyticsData, useTrackProtocolRunEvent } from '../../organisms/Devices/hooks'
import { useTrackEvent } from '../../redux/analytics'

import type { OnDeviceDisplaySettings } from '../../redux/config/types'
import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'

// vi.mock('../../pages/Welcome')
// vi.mock('../../pages/NetworkSetupMenu')
// vi.mock('../../pages/ConnectViaEthernet')
// vi.mock('../../pages/ConnectViaUSB')
// vi.mock('../../pages/ConnectViaWifi')
// vi.mock('../../pages/RobotDashboard')
// vi.mock('../../pages/RobotSettingsDashboard')
// vi.mock('../../pages/ProtocolDashboard')
// vi.mock('../../pages/ProtocolSetup')
// vi.mock('../../pages/ProtocolDetails')
// vi.mock('../../pages/InstrumentsDashboard')
// vi.mock('../../pages/RunningProtocol')
// vi.mock('../../pages/RunSummary')
// vi.mock('../../pages/NameRobot')
// vi.mock('../../pages/InitialLoadingScreen')
// vi.mock('../../pages/EmergencyStop')
// vi.mock('../../pages/DeckConfiguration')
vi.mock('../../redux/analytics')
vi.mock('../../redux/config')
vi.mock('../../redux/shell')
vi.mock('../../redux/discovery')
vi.mock('../hooks')
vi.mock('../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun')
vi.mock('../../organisms/ProtocolUpload/hooks/useMostRecentRunId')
vi.mock('../../resources/runs/useNotifyRunQuery')
vi.mock('../../organisms/Devices/hooks')
vi.mock('@opentrons/react-api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useProtocolQuery: vi.fn()
  }
})

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
    vi.mocked(getIsShellReady).mockReturnValue(false)
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
    cleanup()
  })

  // it('renders Welcome component from /welcome', () => {
  //   render('/welcome')
  //   expect(vi.mocked(Welcome)).toHaveBeenCalled()
  // })

  // it('renders NetworkSetupMenu component from /network-setup', () => {
  //   render('/network-setup')
  //   expect(vi.mocked(NetworkSetupMenu)).toHaveBeenCalled()
  // })

  // it('renders ConnectViaEthernet component from /network-setup/ethernet', () => {
  //   render('/network-setup/ethernet')
  //   expect(vi.mocked(ConnectViaEthernet)).toHaveBeenCalled()
  // })

  // it('renders ConnectViaUSB component from /network-setup/usb', () => {
  //   render('/network-setup/usb')
  //   expect(vi.mocked(ConnectViaUSB)).toHaveBeenCalled()
  // })

  // it('renders ConnectViaWifi component from /network-setup/wifi', () => {
  //   render('/network-setup/wifi')
  //   expect(vi.mocked(ConnectViaWifi)).toHaveBeenCalled()
  // })

  // it('renders RobotDashboard component from /dashboard', () => {
  //   render('/dashboard')
  //   expect(vi.mocked(RobotDashboard)).toHaveBeenCalled()
  // })
  // it('renders ProtocolDashboard component from /protocols', () => {
  //   render('/protocols')
  //   expect(vi.mocked(ProtocolDashboard)).toHaveBeenCalled()
  // })
  // it('renders ProtocolDetails component from /protocols/:protocolId/setup', () => {
  //   render('/protocols/my-protocol-id')
  //   expect(vi.mocked(ProtocolDetails)).toHaveBeenCalled()
  // })

  // it('renders RobotSettingsDashboard component from /robot-settings', () => {
  //   render('/robot-settings')
  //   expect(vi.mocked(RobotSettingsDashboard)).toHaveBeenCalled()
  // })
  // it('renders InstrumentsDashboard component from /instruments', () => {
  //   render('/instruments')
  //   expect(vi.mocked(InstrumentsDashboard)).toHaveBeenCalled()
  // })
  // it('when current run route present renders ProtocolSetup component from /runs/:runId/setup', () => {
  //   vi.mocked(useCurrentRunRoute).mockReturnValue('/runs/my-run-id/setup')
  //   render('/runs/my-run-id/setup')
  //   expect(vi.mocked(ProtocolSetup)).toHaveBeenCalled()
  // })
  // it('when current run route present renders RunningProtocol component from /runs/:runId/run', () => {
  //   vi.mocked(useCurrentRunRoute).mockReturnValue('/runs/my-run-id/run')
  //   render('/runs/my-run-id/run')
  //   expect(vi.mocked(RunningProtocol)).toHaveBeenCalled()
  // })
  it.only('when current run route present renders a RunSummary component from /runs/:runId/summary', () => {
    const protocolName = 'fake-protocol-name'
    vi.mocked(useCurrentRunRoute).mockReturnValue('/runs/my-run-id/summary')
    vi.mocked(useMostRecentRunId).mockReturnValue('my-run-id')
    vi.mocked(useTrackEvent).mockReturnValue(vi.fn())
    vi.mocked(useTrackProtocolRunEvent).mockReturnValue({trackProtocolRunEvent: vi.fn()})
    vi.mocked(useRobotAnalyticsData).mockReturnValue({} as any)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: {
        data: {
          current: true,
          protocolId: 'protocol-id',
          status: RUN_STATUS_SUCCEEDED
        }
      }
    } as any)
    vi.mocked(ReactApiClient.useProtocolQuery).mockReturnValue({
      data: {
        data: {
          metadata: {protocolName },
          files: [{name: 'file name'}]
        }
      }
    } as any)
    render('/runs/my-run-id/summary')
    screen.getByText(protocolName)
  })
  it('renders the loading screen on mount', () => {
    vi.mocked(useCurrentRunRoute).mockReturnValue('/loading')
    vi.mocked(getIsShellReady).mockReturnValue(true)
    render('/loading')
    screen.getByLabelText('loading indicator')
  })
  it('renders EmergencyStop component from /emergency-stop', () => {
    vi.mocked(useCurrentRunRoute).mockReturnValue('/emergency-stop')
    render('/emergency-stop')
    screen.getByText('Install the E-stop')
  })
  it('renders DeckConfiguration component from /deck-configuration', () => {
    vi.mocked(useCurrentRunRoute).mockReturnValue('/deck-configuration')
    render('/deck-configuration')
    screen.getByText('Deck configuration')
  })
  it('renders protocol receipt toasts', () => {
    render('/')
    expect(vi.mocked(useProtocolReceiptToast)).toHaveBeenCalled()
  })
})
