import * as React from 'react'

import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'

import { i18n } from '../../../i18n'
import { useWifiList } from '../../../resources/networking/hooks'
import * as Networking from '../../../redux/networking'
import * as Fixtures from '../../../redux/networking/__fixtures__'

import { useNetworkConnection } from '../hooks/useNetworkConnection'

jest.mock('../../../../resources/networking/hooks')
jest.mock('../../../../redux/networking/selectors')

const mockRobotName = 'robot-name'
const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
    securityType: Networking.SECURITY_NONE,
  },
]

const mockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const mockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'US:B0:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

const mockUseWifiList = useWifiList as jest.MockedFunction<typeof useWifiList>
const mockGetNetworkInterface = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

const store: Store<any> = createStore(jest.fn(), {})

// ToDo (kj:0202/2023) USB test cases will be added when USB is out
describe('useNetworkConnection', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
    )

    when(mockUseWifiList)
      .calledWith(mockRobotName, 10000)
      .mockReturnValue(mockWifiList)
    when(mockGetNetworkInterface)
      .calledWith(undefined as any, mockRobotName)
      .mockReturnValue({ wifi: mockWifi, ethernet: mockEthernet })
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })
  it('should return network connection information - wifi and ethernet are connected', () => {
    const { result } = renderHook(() => useNetworkConnection(mockRobotName), {
      wrapper,
    })
    expect(result.current.activeSsid).toBe('foo')
    expect(result.current.isWifiConnected).toBe(true)
    expect(result.current.isEthernetConnected).toBe(true)
    expect(result.current.connectionStatus).toBe(
      'Connected via Wi-Fi and Ethernet'
    )
  })

  it('should return network connection information - only wifi is connected and ethernet is connected', () => {
    when(mockGetNetworkInterface)
      .calledWith(undefined as any, mockRobotName)
      .mockReturnValue({ wifi: mockWifi, ethernet: null })
    const { result } = renderHook(() => useNetworkConnection(mockRobotName), {
      wrapper,
    })
    expect(result.current.activeSsid).toBe('foo')
    expect(result.current.isWifiConnected).toBe(true)
    expect(result.current.isEthernetConnected).toBe(false)
    expect(result.current.connectionStatus).toBe('foo')
  })

  it('should return network connection information - only ethernet is connected', () => {
    when(mockGetNetworkInterface)
      .calledWith(undefined as any, mockRobotName)
      .mockReturnValue({ wifi: null, ethernet: mockEthernet })
    const { result } = renderHook(() => useNetworkConnection(mockRobotName), {
      wrapper,
    })
    expect(result.current.isWifiConnected).toBe(false)
    expect(result.current.isEthernetConnected).toBe(true)
    expect(result.current.connectionStatus).toBe('Connected via Ethernet')
  })

  it('should return network connection information - wifi and ethernet are not connected', () => {
    when(mockGetNetworkInterface)
      .calledWith(undefined as any, mockRobotName)
      .mockReturnValue({ wifi: null, ethernet: null })
    const { result } = renderHook(() => useNetworkConnection(mockRobotName), {
      wrapper,
    })
    expect(result.current.isWifiConnected).toBe(false)
    expect(result.current.isEthernetConnected).toBe(false)
    expect(result.current.connectionStatus).toBe('Not connected')
  })
})
