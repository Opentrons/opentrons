import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import * as Networking from '../../../../redux/networking'
import * as Fixtures from '../../../../redux/networking/__fixtures__'
import { useIsOT3, useIsRobotBusy } from '../../hooks'
import { DisconnectModal } from '../ConnectNetwork/DisconnectModal'
import { RobotSettingsNetworking } from '../RobotSettingsNetworking'

import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/networking')
jest.mock('../../../../redux/robot-api/selectors')
jest.mock('../../hooks')
jest.mock('../ConnectNetwork/DisconnectModal')

const mockUpdateRobotStatus = jest.fn()

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>
const mockFetchWifiList = Networking.fetchWifiList as jest.MockedFunction<
  typeof Networking.fetchWifiList
>
const mockGetWifiList = Networking.getWifiList as jest.MockedFunction<
  typeof Networking.getWifiList
>

const mockGetCanDisconnect = Networking.getCanDisconnect as jest.MockedFunction<
  typeof Networking.getCanDisconnect
>

const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>
const mockDisconnectModal = DisconnectModal as jest.MockedFunction<
  typeof DisconnectModal
>

const ROBOT_NAME = 'otie'

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsNetworking
        robotName={ROBOT_NAME}
        updateRobotStatus={mockUpdateRobotStatus}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'US:B0:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar', active: false },
]

describe('RobotSettingsNetworking', () => {
  jest.useFakeTimers()

  beforeEach(() => {
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: initialMockWifi,
        ethernet: initialMockEthernet,
      })

    when(mockGetWifiList)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue(mockWifiList)

    when(mockUseIsOT3).calledWith(ROBOT_NAME).mockReturnValue(false)
    when(mockUseIsRobotBusy).calledWith({ poll: true }).mockReturnValue(false)
    when(mockGetCanDisconnect)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue(false)
    mockDisconnectModal.mockReturnValue(<div>mock disconnect modal</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title and description', () => {
    const [{ getByText, getByTestId, queryByRole, queryByText }] = render()
    getByText('Wi-Fi - foo')
    getByText('Wired USB')
    getByText('Learn about connecting to a robot via USB')
    getByText('Looking for USB-to-Ethernet Adapter info?')
    getByText('Go to Advanced App Settings')
    expect(
      getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(getByTestId('RobotSettings_Networking_usb_icon')).toBeInTheDocument()
    expect(queryByText('Wi-Fi - bar')).not.toBeInTheDocument()
    expect(queryByRole('button', { name: 'Disconnect from Wi-Fi' })).toBeNull()
  })

  it('should render title and description for OT-3', () => {
    when(mockUseIsOT3).calledWith(ROBOT_NAME).mockReturnValue(true)
    const [{ getByText, queryByText }] = render()
    getByText('Wi-Fi - foo')
    getByText('Ethernet')
    getByText('USB')
    expect(queryByText('Learn about connecting to a robot via USB')).toBeNull()
    expect(queryByText('Looking for USB-to-Ethernet Adapter info?')).toBeNull()
    expect(queryByText('Go to Advanced App Settings')).toBeNull()
  })

  it('should render Wi-Fi mock data and ethernet mock data', () => {
    const [{ getByText, getByTestId, queryByText, queryAllByTestId }] = render()
    getByText('Wi-Fi - foo')
    getByText('Wired USB')
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
    expect(queryByText('Wi-Fi - bar')).not.toBeInTheDocument()
    expect(
      getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(getByTestId('RobotSettings_Networking_usb_icon')).toBeInTheDocument()
    expect(
      queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(2)
  })

  it('should render Wi-Fi mock data and ethernet info not rendered', () => {
    const mockWiFi = {
      ipAddress: '1.2.3.4',
      subnetMask: '255.255.255.123',
      macAddress: '00:00:00:00:00:00',
      type: Networking.INTERFACE_WIFI,
    }
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({ wifi: mockWiFi, ethernet: null })

    const [{ getByText, getByTestId, queryByText, queryAllByTestId }] = render()
    getByText('Wi-Fi - foo')
    getByText('Wireless IP')
    getByText('Wireless Subnet Mask')
    getByText('Wireless MAC Address')
    getByText('1.2.3.4')
    getByText('255.255.255.123')
    getByText('00:00:00:00:00:00')
    getByText('Wired USB')
    getByText('Not connected via wired USB')
    expect(queryByText('Wi-Fi - bar')).not.toBeInTheDocument()
    expect(
      getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(getByTestId('RobotSettings_Networking_usb_icon')).toBeInTheDocument()
    expect(
      queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(1)
  })

  it('should render Wired USB mock data and wifi info not rendered', () => {
    const mockWiredUSB = {
      ipAddress: '5.6.7.8',
      subnetMask: '255.255.255.124',
      macAddress: '00:00:00:00:00:00',
      type: Networking.INTERFACE_ETHERNET,
    }
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: null,
        ethernet: mockWiredUSB,
      })
    when(mockGetWifiList)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue([])
    const [{ getByText, getByTestId, queryAllByTestId }] = render()

    getByText('Wired USB')
    getByText('Wired IP')
    getByText('Wired Subnet Mask')
    getByText('Wired MAC Address')
    getByText('5.6.7.8')
    getByText('255.255.255.124')
    getByText('00:00:00:00:00:00')
    getByText('Wi-Fi')
    expect(
      getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(getByTestId('RobotSettings_Networking_usb_icon')).toBeInTheDocument()
    expect(
      queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(1)
  })

  it('should render Wi-Fi and Wired USB are not connected', () => {
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: null,
        ethernet: null,
      })
    when(mockGetWifiList)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue([])
    const [{ getByText, queryByText, queryAllByTestId }] = render()

    expect(queryByText('Wireless IP')).not.toBeInTheDocument()
    expect(queryByText('Wireless Subnet Mask')).not.toBeInTheDocument()
    expect(queryByText('Wireless MAC Address')).not.toBeInTheDocument()
    expect(queryByText('Wired IP')).not.toBeInTheDocument()
    expect(queryByText('Wired Subnet Mask')).not.toBeInTheDocument()
    expect(queryByText('Wired MAC Address')).not.toBeInTheDocument()
    expect(
      queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(0)
    getByText('Wi-Fi')
    getByText('Wired USB')
    getByText('Not connected via wired USB')
  })

  it('should render the right links to external resource and internal resource', () => {
    const usbExternalLink =
      'https://support.opentrons.com/s/article/Get-started-Connect-to-your-OT-2-over-USB'
    const usbInternalLink = '/app-settings/advanced'
    const [{ getByText }] = render()
    const externalLink = getByText('Learn about connecting to a robot via USB')
    const internalLink = getByText('Go to Advanced App Settings')
    expect(externalLink.closest('a')).toHaveAttribute('href', usbExternalLink)
    expect(internalLink.closest('a')).toHaveAttribute('href', usbInternalLink)
  })

  it('should render Disconnect from Wi-Fi button when robot can disconnect and is not busy', () => {
    when(mockGetCanDisconnect)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue(true)
    const [{ getByRole, getByText, queryByText }] = render()

    expect(queryByText('mock disconnect modal')).toBeNull()
    getByRole('button', { name: 'Disconnect from Wi-Fi' }).click()
    getByText('mock disconnect modal')
  })

  it('should not render Disconnect from Wi-Fi button when robot is busy', () => {
    when(mockGetCanDisconnect)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue(true)
    when(mockUseIsRobotBusy).calledWith({ poll: true }).mockReturnValue(true)
    const [{ queryByRole }] = render()

    expect(queryByRole('button', { name: 'Disconnect from Wi-Fi' })).toBeNull()
  })

  it('dispatches fetchWifiList on mount and on an interval', () => {
    render()
    expect(mockFetchWifiList).toHaveBeenNthCalledWith(1, ROBOT_NAME)
    expect(mockFetchWifiList).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(20000)
    expect(mockFetchWifiList).toHaveBeenNthCalledWith(2, ROBOT_NAME)
    expect(mockFetchWifiList).toHaveBeenNthCalledWith(3, ROBOT_NAME)
    expect(mockFetchWifiList).toHaveBeenCalledTimes(3)
  })
})
