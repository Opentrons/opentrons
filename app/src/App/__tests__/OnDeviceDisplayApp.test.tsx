import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

import { i18n } from '../../i18n'
import { ConnectViaEthernet } from '../../pages/OnDeviceDisplay/ConnectViaEthernet'
import { ConnectViaUSB } from '../../pages/OnDeviceDisplay/ConnectViaUSB'
import { ConnectViaWifi } from '../../pages/OnDeviceDisplay/ConnectViaWifi'
import { InstrumentsDashboard } from '../../pages/OnDeviceDisplay/InstrumentsDashboard'
import { NetworkSetupMenu } from '../../pages/OnDeviceDisplay/NetworkSetupMenu'
import { ProtocolDashboard } from '../../pages/OnDeviceDisplay/ProtocolDashboard'
import { ProtocolSetup } from '../../pages/OnDeviceDisplay/ProtocolSetup'
import { RobotDashboard } from '../../pages/OnDeviceDisplay/RobotDashboard'
import { RobotSettingsDashboard } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import { RunningProtocol } from '../../pages/OnDeviceDisplay/RunningProtocol'
import { RunSummary } from '../../pages/OnDeviceDisplay/RunSummary'
import { Welcome } from '../../pages/OnDeviceDisplay/Welcome'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'

jest.mock('../../pages/OnDeviceDisplay/Welcome')
jest.mock('../../pages/OnDeviceDisplay/NetworkSetupMenu')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaEthernet')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaUSB')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaWifi')
jest.mock('../../pages/OnDeviceDisplay/RobotDashboard')
jest.mock('../../pages/OnDeviceDisplay/RobotSettingsDashboard')
jest.mock('../../pages/OnDeviceDisplay/ProtocolDashboard')
jest.mock('../../pages/OnDeviceDisplay/ProtocolSetup')
jest.mock('../../pages/OnDeviceDisplay/InstrumentsDashboard')
jest.mock('../../pages/OnDeviceDisplay/RunningProtocol')
jest.mock('../../pages/OnDeviceDisplay/RunSummary')

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
const mockConnectViaWifi = ConnectViaWifi as jest.MockedFunction<
  typeof ConnectViaWifi
>
const mockRobotDashboard = RobotDashboard as jest.MockedFunction<
  typeof RobotDashboard
>
const mockProtocolDashboard = ProtocolDashboard as jest.MockedFunction<
  typeof ProtocolDashboard
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
    mockRobotSettingsDashboard.mockReturnValue(
      <div>Mock RobotSettingsDashboard</div>
    )
    mockRunningProtocol.mockReturnValue(<div>Mock RunningProtocol</div>)
    mockRunSummary.mockReturnValue(<div>Mock RunSummary</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders Welcome component from /welcome', () => {
    const [{ getByText }] = render('/welcome')
    getByText('Mock Welcome')
  })

  it('renders NetworkSetupMenu component from /network-setup', () => {
    const [{ getByText }] = render('/network-setup')
    getByText('Mock NetworkSetupMenu')
  })

  it('renders ConnectViaEthernet component from /network-setup/ethernet', () => {
    const [{ getByText }] = render('/network-setup/ethernet')
    getByText('Mock ConnectViaEthernet')
  })

  it('renders ConnectViaUSB component from /network-setup/usb', () => {
    const [{ getByText }] = render('/network-setup/usb')
    getByText('Mock ConnectViaUSB')
  })

  it('renders ConnectViaWifi component from /network-setup/wifi', () => {
    const [{ getByText }] = render('/network-setup/wifi')
    getByText('Mock ConnectViaWifi')
  })

  it('renders RobotDashboard component from /dashboard', () => {
    const [{ getByText }] = render('/dashboard')
    getByText('Mock RobotDashboard')
  })
  it('renders ProtocolDashboard component from /protocols', () => {
    const [{ getByText }] = render('/protocols')
    getByText('Mock ProtocolDashboard')
  })
  it('renders ProtocolSetup component from /protocols/:runId/setup', () => {
    const [{ getByText }] = render('/protocols/my-protocol-id/setup')
    getByText('Mock ProtocolSetup')
  })
  it('renders RobotSettingsDashboard component from /robot-settings', () => {
    const [{ getByText }] = render('/robot-settings')
    getByText('Mock RobotSettingsDashboard')
  })
  it('renders InstrumentsDashboard component from /instruments', () => {
    const [{ getByText }] = render('/instruments')
    getByText('Mock InstrumentsDashboard')
  })
  it('renders RunningProtocol component from /protocols/:runId/run', () => {
    const [{ getByText }] = render('/protocols/my-run-id/run')
    getByText('Mock RunningProtocol')
  })
  it('renders a RunSummary component from /protocols/:runId/summary', () => {
    const [{ getByText }] = render('/protocols/my-run-id/summary')
    getByText('Mock RunSummary')
  })
})
