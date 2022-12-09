import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { ConnectedNetworkInfo } from '../../pages/OnDeviceDisplay/ConnectedNetworkInfo'
import { ConnectViaUSB } from '../../pages/OnDeviceDisplay/ConnectViaUSB'
import { ConfirmRobotName } from '../../pages/OnDeviceDisplay/ConfirmRobotName'
import { InitialSplash } from '../../pages/OnDeviceDisplay/InitialSplash'
import { NetworkSetupMenu } from '../../pages/OnDeviceDisplay/NetworkSetupMenu'
import { RobotDashboard } from '../../pages/OnDeviceDisplay/RobotDashboard'
import { SelectWifiNetwork } from '../../pages/OnDeviceDisplay/SelectWifiNetwork'
import { SetWifiCred } from '../../pages/OnDeviceDisplay/SetWifiCred'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'

jest.mock('../../pages/OnDeviceDisplay/ConnectedNetworkInfo')
jest.mock('../../pages/OnDeviceDisplay/InitialSplash')
jest.mock('../../pages/OnDeviceDisplay/NetworkSetupMenu')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaUSB')
jest.mock('../../pages/OnDeviceDisplay/ConfirmRobotName')
jest.mock('../../pages/OnDeviceDisplay/RobotDashboard')
jest.mock('../../pages/OnDeviceDisplay/SelectWifiNetwork')
jest.mock('../../pages/OnDeviceDisplay/SetWifiCred')

const mockInitialSplash = InitialSplash as jest.MockedFunction<
  typeof InitialSplash
>
const mockNetworkSetupMenu = NetworkSetupMenu as jest.MockedFunction<
  typeof NetworkSetupMenu
>
const mockConnectViaUSB = ConnectViaUSB as jest.MockedFunction<
  typeof ConnectViaUSB
>
const mockConfirmRobotName = ConfirmRobotName as jest.MockedFunction<
  typeof ConfirmRobotName
>
const mockSelectWifiNetwork = SelectWifiNetwork as jest.MockedFunction<
  typeof SelectWifiNetwork
>
const mockSetWifiCred = SetWifiCred as jest.MockedFunction<typeof SetWifiCred>
const mockConnectedNetworkInfo = ConnectedNetworkInfo as jest.MockedFunction<
  typeof ConnectedNetworkInfo
>
const mockRobotDashboard = RobotDashboard as jest.MockedFunction<
  typeof RobotDashboard
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
    mockInitialSplash.mockReturnValue(<div>Mock InitialSplash</div>)
    mockNetworkSetupMenu.mockReturnValue(<div>Mock NetworkSetupMenu</div>)
    mockConnectViaUSB.mockReturnValue(<div>Mock ConnectViaUSB</div>)
    mockConfirmRobotName.mockReturnValue(<div>Mock ConfirmRobotName</div>)
    mockSelectWifiNetwork.mockReturnValue(<div>Mock SelectWifiNetwork</div>)
    mockSetWifiCred.mockReturnValue(<div>Mock SetWifiCred</div>)
    mockConnectedNetworkInfo.mockReturnValue(
      <div>Mock ConnectedNetworkInfo</div>
    )
    mockRobotDashboard.mockReturnValue(<div>Mock RobotDashboard</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a InitialSplash component component from /', () => {
    const [{ getByText }] = render('/')
    getByText('Mock InitialSplash')
  })

  it('renders a NetworkSetupMenu component from /network-setup', () => {
    const [{ getByText }] = render('/network-setup')
    getByText('Mock NetworkSetupMenu')
  })

  it('renders a ConnectViaUSB component from /network-setup', () => {
    const [{ getByText }] = render('/network-setup/usb')
    getByText('Mock ConnectViaUSB')
  })

  it('renders a SelectWifiNetwork component from /connect-via-wifi', () => {
    const [{ getByText }] = render('/network-setup/wifi')
    getByText('Mock SelectWifiNetwork')
  })

  it('renders a SetWifiCred component from /network-setup/wifi/set-wifi-cred/:ssid', () => {
    const [{ getByText }] = render('/network-setup/wifi/set-wifi-cred/mockWifi')
    getByText('Mock SetWifiCred')
  })

  it('renders a ConnectedNetworkInfo component from /network-setup/wifi/connected-network-info/:ssid', () => {
    const [{ getByText }] = render(
      '/network-setup/wifi/connected-network-info/mockWifi'
    )
    getByText('Mock ConnectedNetworkInfo')
  })
  it('renders a RobotDashboard component from /dashboard', () => {
    const [{ getByText }] = render('/dashboard')
    getByText('Mock RobotDashboard')
  })
})
