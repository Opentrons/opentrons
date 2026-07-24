import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import {
  INTERFACE_ETHERNET,
  INTERFACE_WIFI,
  mockWifiNetwork,
} from '@opentrons/api-client'
import {
  useEapOptionsQuery,
  usePostWifiConfigureMutation,
  useWifiKeysQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useIsFlex, useIsRobotBusy } from '/app/redux-resources/robots'
import {
  getRobotAddressesByName,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_OK,
  OPENTRONS_USB,
} from '/app/redux/discovery'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import {
  useCanDisconnect,
  useNetworkInterfaces,
  useWifiList,
} from '/app/resources/networking/hooks'

import { DisconnectModal } from '../ConnectNetwork/DisconnectModal'
import { RobotSettingsNetworking } from '../RobotSettingsNetworking'

import type { ComponentProps } from 'react'
import type { DiscoveryClientRobotAddress } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/robot-api/selectors')
vi.mock('/app/resources/networking/hooks')
vi.mock('/app/redux-resources/robots')
vi.mock('../ConnectNetwork/DisconnectModal')
vi.mock('/app/resources/devices/hooks/useIsEstopNotDisengaged')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const ROBOT_NAME = 'otie'

const render = (
  props?: Partial<ComponentProps<typeof RobotSettingsNetworking>>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsNetworking
        robotName={ROBOT_NAME}
        isRobotBusy={props?.isRobotBusy ?? false}
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
  type: INTERFACE_WIFI,
}

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'US:B0:00:00:00:00',
  type: INTERFACE_ETHERNET,
}

const mockWifiList = [
  { ...mockWifiNetwork, ssid: 'foo', active: true },
  { ...mockWifiNetwork, ssid: 'bar', active: false },
]

describe('RobotSettingsNetworking', () => {
  vi.useFakeTimers()

  beforeEach(() => {
    vi.mocked(useWifiKeysQuery).mockReturnValue({ data: { keys: [] } } as any)
    vi.mocked(useEapOptionsQuery).mockReturnValue({ data: { options: [] } } as any)
    vi.mocked(usePostWifiConfigureMutation).mockReturnValue({
      postWifiConfigure: vi.fn(),
      mutate: vi.fn(),
      reset: vi.fn(),
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      status: 'idle',
    } as any)
    when(getRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn([
        {
          ip: initialMockWifi.ipAddress,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
        {
          ip: initialMockEthernet.ipAddress,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
      ])
    when(useNetworkInterfaces)
      .calledWith(ROBOT_NAME, 5000)
      .thenReturn({
        wifi: initialMockWifi,
        ethernet: initialMockEthernet,
      })

    when(useWifiList).calledWith(ROBOT_NAME, 10000).thenReturn(mockWifiList)

    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(false)
    when(useIsRobotBusy).calledWith({ poll: true }).thenReturn(false)
    when(useCanDisconnect).calledWith(ROBOT_NAME).thenReturn(false)
    vi.mocked(DisconnectModal).mockReturnValue(<div>mock disconnect modal</div>)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
  })

  it('should render title and description for OT-2', () => {
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn(mockWifiList)
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
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn(mockWifiList)
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
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
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn(mockWifiList)
    when(useIsFlex).calledWith(ROBOT_NAME).thenReturn(true)
    when(getRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn([
        {
          ip: OPENTRONS_USB,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
      ])

    render()
    screen.getByText('Directly connected to this computer.')
  })

  it('should render Wi-Fi mock data and ethernet mock data for OT-2', () => {
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn(mockWifiList)
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
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn(mockWifiList)
    const mockWiFi = {
      ipAddress: '1.2.3.4',
      subnetMask: '255.255.255.123',
      macAddress: '00:00:00:00:00:00',
      type: INTERFACE_WIFI,
    }
    when(useNetworkInterfaces)
      .calledWith(ROBOT_NAME, 5000)
      .thenReturn({ wifi: mockWiFi, ethernet: null })
    when(getRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn([
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
      type: INTERFACE_ETHERNET,
    }
    when(useNetworkInterfaces)
      .calledWith(ROBOT_NAME, 5000)
      .thenReturn({
        wifi: null,
        ethernet: mockWiredUSB,
      })
    when(getRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn([
        {
          ip: mockWiredUSB.ipAddress,
          healthStatus: HEALTH_STATUS_OK,
        } as DiscoveryClientRobotAddress,
      ])
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn([])
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
    when(useNetworkInterfaces)
      .calledWith(ROBOT_NAME, 5000)
      .thenReturn({
        wifi: null,
        ethernet: null,
      })
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn([])
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
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn([])
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
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn([])
    when(useCanDisconnect).calledWith(ROBOT_NAME).thenReturn(true)
    render()
    expect(screen.queryByText('mock disconnect modal')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Disconnect from Wi-Fi' })
    )
    // screen.getByText('mock disconnect modal')
  })

  it('should not render Disconnect from Wi-Fi button when robot is busy', () => {
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn([])
    when(useCanDisconnect).calledWith(ROBOT_NAME).thenReturn(true)
    render({ isRobotBusy: true })

    expect(
      screen.queryByRole('button', { name: 'Disconnect from Wi-Fi' })
    ).toBeNull()
  })

  it('should not render connected check circles when discovery client cannot find a healthy robot at its network connection ip addresses', () => {
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn(mockWifiList)
    when(getRobotAddressesByName)
      .calledWith({} as State, ROBOT_NAME)
      .thenReturn([
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

  it('should not render disabled Disconnect from Wi-Fi button when e-stop is pressed', () => {
    when(useWifiList).calledWith(ROBOT_NAME).thenReturn([])
    when(useCanDisconnect).calledWith(ROBOT_NAME).thenReturn(true)
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(true)
    render()
    expect(
      screen.queryByRole('button', { name: 'Disconnect from Wi-Fi' })
    ).toBeDisabled()
  })
})
