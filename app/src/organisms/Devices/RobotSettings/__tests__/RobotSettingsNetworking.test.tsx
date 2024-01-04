import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import {
  getRobotAddressesByName,
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  OPENTRONS_USB,
} from '../../../../redux/discovery'
import * as Networking from '../../../../redux/networking'
import {
  useCanDisconnect,
  useWifiList,
} from '../../../../resources/networking/hooks'
import * as Fixtures from '../../../../redux/networking/__fixtures__'
import { useIsFlex, useIsRobotBusy } from '../../hooks'
import { DisconnectModal } from '../ConnectNetwork/DisconnectModal'
import { RobotSettingsNetworking } from '../RobotSettingsNetworking'

import type { DiscoveryClientRobotAddress } from '../../../../redux/discovery/types'
import type { State } from '../../../../redux/types'
import { fireEvent, screen } from '@testing-library/react'

jest.mock('../../../../redux/discovery/selectors')
jest.mock('../../../../redux/networking')
jest.mock('../../../../redux/robot-api/selectors')
jest.mock('../../../../resources/networking/hooks')
jest.mock('../../hooks')
jest.mock('../ConnectNetwork/DisconnectModal')

const mockUpdateRobotStatus = jest.fn()

const mockGetRobotAddressesByName = getRobotAddressesByName as jest.MockedFunction<
  typeof getRobotAddressesByName
>
const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>
const mockUseWifiList = useWifiList as jest.MockedFunction<typeof useWifiList>
const mockUseCanDisconnect = useCanDisconnect as jest.MockedFunction<
  typeof useCanDisconnect
>

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
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
    when(mockGetRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue([
        {
          ip: initialMockWifi.ipAddress,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
        {
          ip: initialMockEthernet.ipAddress,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
      ])
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: initialMockWifi,
        ethernet: initialMockEthernet,
      })

    when(mockUseWifiList)
      .calledWith(ROBOT_NAME, 10000)
      .mockReturnValue(mockWifiList)

    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(false)
    when(mockUseIsRobotBusy).calledWith({ poll: true }).mockReturnValue(false)
    when(mockUseCanDisconnect).calledWith(ROBOT_NAME).mockReturnValue(false)
    mockDisconnectModal.mockReturnValue(<div>mock disconnect modal</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render title and description for OT-2', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue(mockWifiList)
    render()
    screen.getByText('Wi-Fi - foo')
    screen.getByText('Wired USB')
    screen.getByText('Learn about connecting to a robot via USB')
    screen.getByText('Looking for USB-to-Ethernet Adapter info?')
    screen.getByText('Go to Advanced App Settings')
    expect(
      screen.getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_usb_icon')
    ).toBeInTheDocument()
    expect(screen.queryByText('Wi-Fi - bar')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Disconnect from Wi-Fi' })
    ).toBeNull()
  })

  it('should render title and description for Flex', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue(mockWifiList)
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
    render()
    screen.getByText('Wi-Fi - foo')
    screen.getByText('Ethernet')
    screen.getByText('USB')
    expect(
      screen.queryByText('Learn about connecting to a robot via USB')
    ).toBeNull()
    expect(
      screen.queryByText('Looking for USB-to-Ethernet Adapter info?')
    ).toBeNull()
    expect(screen.queryByText('Go to Advanced App Settings')).toBeNull()
  })

  it('should render USB connection message for Flex when connected via USB', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue(mockWifiList)
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
    when(mockGetRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue([
        {
          ip: OPENTRONS_USB,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
      ])

    render()
    screen.getByText('Directly connected to this computer.')
  })

  it('should render Wi-Fi mock data and ethernet mock data for OT-2', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue(mockWifiList)
    render()
    screen.getByText('Wi-Fi - foo')
    screen.getByText('Wired USB')
    screen.getByText('Wireless IP')
    screen.getByText('Wireless Subnet Mask')
    screen.getByText('Wireless MAC Address')
    screen.getByText('127.0.0.100')
    screen.getByText('255.255.255.230')
    screen.getByText('WI:FI:00:00:00:00')
    screen.getByText('Wired IP')
    screen.getByText('Wired Subnet Mask')
    screen.getByText('Wired MAC Address')
    screen.getByText('127.0.0.101')
    screen.getByText('255.255.255.231')
    screen.getByText('US:B0:00:00:00:00')
    expect(screen.queryByText('Wi-Fi - bar')).not.toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_usb_icon')
    ).toBeInTheDocument()
    expect(
      screen.queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(2)
  })

  it('should render Wi-Fi mock data and ethernet info not rendered for OT-2', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue(mockWifiList)
    const mockWiFi = {
      ipAddress: '1.2.3.4',
      subnetMask: '255.255.255.123',
      macAddress: '00:00:00:00:00:00',
      type: Networking.INTERFACE_WIFI,
    }
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({ wifi: mockWiFi, ethernet: null })
    when(mockGetRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue([
        {
          ip: mockWiFi.ipAddress,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
      ])
    render()
    screen.getByText('Wi-Fi - foo')
    screen.getByText('Wireless IP')
    screen.getByText('Wireless Subnet Mask')
    screen.getByText('Wireless MAC Address')
    screen.getByText('1.2.3.4')
    screen.getByText('255.255.255.123')
    screen.getByText('00:00:00:00:00:00')
    screen.getByText('Wired USB')
    screen.getByText('Not connected via wired USB')
    expect(screen.queryByText('Wi-Fi - bar')).not.toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_usb_icon')
    ).toBeInTheDocument()
    expect(
      screen.queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(1)
  })

  it('should render Wired USB mock data and wifi info not rendered for OT-2', () => {
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
    when(mockGetRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue([
        {
          ip: mockWiredUSB.ipAddress,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
      ])
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue([])
    render()

    screen.getByText('Wired USB')
    screen.getByText('Wired IP')
    screen.getByText('Wired Subnet Mask')
    screen.getByText('Wired MAC Address')
    screen.getByText('5.6.7.8')
    screen.getByText('255.255.255.124')
    screen.getByText('00:00:00:00:00:00')
    screen.getByText('Wi-Fi - foo')
    expect(
      screen.getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_usb_icon')
    ).toBeInTheDocument()
    expect(
      screen.queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(1)
  })

  it('should render Wi-Fi and Wired USB are not connected for OT-2', () => {
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: null,
        ethernet: null,
      })
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue([])
    render()

    expect(screen.queryByText('Wireless IP')).not.toBeInTheDocument()
    expect(screen.queryByText('Wireless Subnet Mask')).not.toBeInTheDocument()
    expect(screen.queryByText('Wireless MAC Address')).not.toBeInTheDocument()
    expect(screen.queryByText('Wired IP')).not.toBeInTheDocument()
    expect(screen.queryByText('Wired Subnet Mask')).not.toBeInTheDocument()
    expect(screen.queryByText('Wired MAC Address')).not.toBeInTheDocument()
    expect(
      screen.queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(0)
    screen.getByText('Wi-Fi - foo')
    screen.getByText('Wired USB')
    screen.getByText('Not connected via wired USB')
  })

  it('should render the right links to external resource and internal resource for OT-2', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue([])
    const usbExternalLink =
      'https://support.opentrons.com/s/article/Get-started-Connect-to-your-OT-2-over-USB'
    const usbInternalLink = '/app-settings/advanced'
    render()
    const externalLink = screen.getByText(
      'Learn about connecting to a robot via USB'
    )
    const internalLink = screen.getByText('Go to Advanced App Settings')
    expect(externalLink).toHaveAttribute('href', usbExternalLink)
    expect(internalLink).toHaveAttribute('href', usbInternalLink)
  })

  it('should render Disconnect from Wi-Fi button when robot can disconnect and is not busy', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue([])
    when(mockUseCanDisconnect).calledWith(ROBOT_NAME).mockReturnValue(true)
    render()
    expect(screen.queryByText('mock disconnect modal')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Disconnect from Wi-Fi' })
    )
    screen.getByText('mock disconnect modal')
  })

  it('should not render Disconnect from Wi-Fi button when robot is busy', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue([])
    when(mockUseCanDisconnect).calledWith(ROBOT_NAME).mockReturnValue(true)
    when(mockUseIsRobotBusy).calledWith({ poll: true }).mockReturnValue(true)
    render()

    expect(
      screen.queryByRole('button', { name: 'Disconnect from Wi-Fi' })
    ).toBeNull()
  })

  it('should not render connected check circles when discovery client cannot find a healthy robot at its network connection ip addresses', () => {
    when(mockUseWifiList).calledWith(ROBOT_NAME).mockReturnValue(mockWifiList)
    when(mockGetRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue([
        {
          ip: 'some-other-ip',
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
        {
          ip: initialMockEthernet.ipAddress,
          healthStatus: HEALTH_STATUS_NOT_OK,
        } as DiscoveryClientRobotAddress,
      ])
    render()
    screen.getByText('Wi-Fi - foo')
    screen.getByText('Wired USB')
    screen.getByText('Wireless IP')
    screen.getByText('Wireless Subnet Mask')
    screen.getByText('Wireless MAC Address')
    screen.getByText('127.0.0.100')
    screen.getByText('255.255.255.230')
    screen.getByText('WI:FI:00:00:00:00')
    screen.getByText('Wired IP')
    screen.getByText('Wired Subnet Mask')
    screen.getByText('Wired MAC Address')
    screen.getByText('127.0.0.101')
    screen.getByText('255.255.255.231')
    screen.getByText('US:B0:00:00:00:00')
    expect(screen.queryByText('Wi-Fi - bar')).not.toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_wifi_icon')
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('RobotSettings_Networking_usb_icon')
    ).toBeInTheDocument()
    expect(
      screen.queryAllByTestId('RobotSettings_Networking_check_circle')
    ).toHaveLength(0)
  })
})
