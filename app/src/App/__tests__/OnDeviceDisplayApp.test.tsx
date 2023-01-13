import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { ConnectViaEthernet } from '../../pages/OnDeviceDisplay/ConnectViaEthernet'
import { ConnectViaUSB } from '../../pages/OnDeviceDisplay/ConnectViaUSB'
import { ConnectViaWifi } from '../../pages/OnDeviceDisplay/ConnectViaWifi'
import { ConfirmRobotName } from '../../pages/OnDeviceDisplay/ConfirmRobotName'
import { InitialSplash } from '../../pages/OnDeviceDisplay/InitialSplash'
import { NetworkSetupMenu } from '../../pages/OnDeviceDisplay/NetworkSetupMenu'
import { RobotDashboard } from '../../pages/OnDeviceDisplay/RobotDashboard'
import { OnDeviceDisplayApp } from '../OnDeviceDisplayApp'

jest.mock('../../pages/OnDeviceDisplay/ConnectedNetworkInfo')
jest.mock('../../pages/OnDeviceDisplay/InitialSplash')
jest.mock('../../pages/OnDeviceDisplay/NetworkSetupMenu')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaEthernet')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaUSB')
jest.mock('../../pages/OnDeviceDisplay/ConnectViaWifi')
jest.mock('../../pages/OnDeviceDisplay/ConfirmRobotName')
jest.mock('../../pages/OnDeviceDisplay/RobotDashboard')

const mockInitialSplash = InitialSplash as jest.MockedFunction<
  typeof InitialSplash
>
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
const mockConfirmRobotName = ConfirmRobotName as jest.MockedFunction<
  typeof ConfirmRobotName
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
    mockConnectViaEthernet.mockReturnValue(<div>Mock ConnectViaEthernet</div>)
    mockConnectViaUSB.mockReturnValue(<div>Mock ConnectViaUSB</div>)
    mockConnectViaWifi.mockReturnValue(<div>Mock ConnectViaWifi</div>)
    mockConfirmRobotName.mockReturnValue(<div>Mock ConfirmRobotName</div>)
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
})
