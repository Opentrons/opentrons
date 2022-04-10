import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
// import components wifi & ethernet
import * as Networking from '../../../../redux/networking'
import { RobotSettingsNetworking } from '../RobotSettingsNetworking'

jest.mock('../../../../redux/networking/selectors')
jest.mock('../../../../redux/robot-api/selectors')

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsNetworking robotName="otie" />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.0.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'US:B0:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

describe('RobotSettingsNetworking', () => {
  beforeEach(() => {
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: initialMockEthernet,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title and description', () => {
    const [{ getByText }] = render()
    getByText('Wi-Fi')
    getByText('Wired USB')
    getByText('Learn about connecting to a robot via USB')
    getByText('Looking for USB-to-Ethernet Adapter info?')
    getByText('Go to Advanced App Settings')
  })

  /*
  it('should render Wi-Fi mock data and ethernet mock data', () => {
    const [{ getByText }] = render()
    getByText('Wireless IP')
    getByText('Wireless Subnet Mask')
    getByText('Wireless MAC Address')
    getByText('127.0.0.100')
    getByText('255.255.255.230')
    getByText('WI:FI:00:00:00:00')
    getByText('Wired IP')
    getByText('Wired Subnet Mask')
    getByText('Wired MAC Address')
    getByText('127.0.0.101')
    getByText('255.255.255.231')
    getByText('US:B0:00:00:00:00')
  })

  it('should render Wi-Fi mock data and ethernet info not rendered', () => {
    const mockWiFi = {
      ipAddress: '1.2.3.4',
      subnetMask: '255.255.255.123',
      macAddress: '00:00:00:00:00:00',
      type: Networking.INTERFACE_WIFI,
    }
    mockGetNetworkInterfaces.mockReturnValue({ wifi: mockWiFi, ethernet: null })

    const [{ getByText }] = render()
  })

  it('should render Wired USB mock data and wifi info not rendered', () => {
    const mockWiredUSB = {
      ipAddress: '5.6.7.8',
      subnetMask: '255.255.255.124',
      macAddress: '00:00:00:00:00:00',
      type: Networking.INTERFACE_ETHERNET,
    }

    mockGetNetworkInterfaces.mockReturnValue({
      wifi: null,
      ethernet: mockWiredUSB,
    })

    const [{ getByText }] = render()

    // wifi info should not be rendered
    // display wired usb info
  })
  */
})
