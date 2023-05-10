import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react-hooks'
import { getRobotApiVersionByName } from '../../../redux/discovery'

import { useCanDisconnect } from '../hooks/useCanDisconnect'
import { useWifiList } from '../hooks/useWifiList'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'
import { SECURITY_WPA_EAP, WifiNetwork } from '@opentrons/api-client'

jest.mock('../hooks/useWifiList')
jest.mock('../../../redux/discovery')

const mockGetRobotApiVersionByName = getRobotApiVersionByName as jest.MockedFunction<
  typeof getRobotApiVersionByName
>

const store: Store<State> = createStore(state => state, {})

const wrapper: React.FunctionComponent<{}> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
)

const mockWifiNetwork: WifiNetwork = {
  ssid: 'linksys',
  signal: 50,
  active: false,
  security: 'WPA2 802.1X',
  securityType: SECURITY_WPA_EAP,
}

describe('useCanDisconnect', () => {
  beforeEach(() => {
    when(useWifiList).calledWith('otie').mockReturnValue([])
  })
  afterEach(() => resetAllWhenMocks())

  it('getCanDisconnect returns true if active network, robot >= 3.17', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: true }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('getCanDisconnect returns false if no list in state', () => {
    when(useWifiList).calledWith('otie').mockReturnValue([])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('getCanDisconnect returns false if no active network', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: false }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('getCanDisconnect returns false if less than 3.17.0', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: true }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.16.999')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('getCanDisconnect returns false if robot API version not found', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: true }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue(null)

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })
})
