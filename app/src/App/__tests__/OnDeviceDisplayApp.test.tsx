import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { ConnectViaEthernet } from '../../pages/OnDeviceDisplay/ConnectViaEthernet'
import { ConnectViaUSB } from '../../pages/OnDeviceDisplay/ConnectViaUSB'
import { ConnectViaWifi } from '../../pages/OnDeviceDisplay/ConnectViaWifi'
import { NetworkSetupMenu } from '../../pages/OnDeviceDisplay/NetworkSetupMenu'
import { RobotDashboard } from '../../pages/OnDeviceDisplay/RobotDashboard'
import { RobotSettingsDashboard } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import { ProtocolDashboard } from '../../pages/OnDeviceDisplay/ProtocolDashboard'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'

jest.mock('../../pages/OnDeviceDisplay/NetworkSetupMenu')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaEthernet')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaUSB')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaWifi')
jest.mock('../../pages/OnDeviceDisplay/RobotDashboard')
jest.mock('../../pages/OnDeviceDisplay/RobotSettingsDashboard')
jest.mock('../../pages/OnDeviceDisplay/ProtocolDashboard')

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
const mockRobotSettingsDashboard = RobotSettingsDashboard as jest.MockedFunction<
  typeof RobotSettingsDashboard
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
    mockNetworkSetupMenu.mockReturnValue(<div>Mock NetworkSetupMenu</div>)
    mockConnectViaEthernet.mockReturnValue(<div>Mock ConnectViaEthernet</div>)
    mockConnectViaUSB.mockReturnValue(<div>Mock ConnectViaUSB</div>)
    mockConnectViaWifi.mockReturnValue(<div>Mock ConnectViaWifi</div>)
    mockRobotDashboard.mockReturnValue(<div>Mock RobotDashboard</div>)
    mockProtocolDashboard.mockReturnValue(<div>Mock ProtocolDashboard</div>)
    mockRobotSettingsDashboard.mockReturnValue(
      <div>Mock RobotSettingsDashboard</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a NetworkSetupMenu component from /network-setup', () => {
    const [{ getByText }] = render('/network-setup')
    getByText('Mock NetworkSetupMenu')
  })

  it('renders a ConnectViaEthernet component from /network-setup/ethernet', () => {
    const [{ getByText }] = render('/network-setup/ethernet')
    getByText('Mock ConnectViaEthernet')
  })

  it('renders a ConnectViaUSB component from /network-setup/usb', () => {
    const [{ getByText }] = render('/network-setup/usb')
    getByText('Mock ConnectViaUSB')
  })

  it('renders a ConnectViaWifi component from /network-setup/wifi', () => {
    const [{ getByText }] = render('/network-setup/wifi')
    getByText('Mock ConnectViaWifi')
  })

  it('renders a RobotDashboard component from /dashboard', () => {
    const [{ getByText }] = render('/dashboard')
    getByText('Mock RobotDashboard')
  })
  it('renders a ProtocolDashboard component from /protocols', () => {
    const [{ getByText }] = render('/protocols')
    getByText('Mock ProtocolDashboard')
  })
  it('renders a RobotSettingsDashboard component from /robot-settings', () => {
    const [{ getByText }] = render('/robot-settings')
    getByText('Mock RobotSettingsDashboard')
  })
})
