import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { getRobotApiVersionByName } from '../../../redux/discovery'

import { useIsFlex } from '../../../organisms/Devices/hooks'
import { useCanDisconnect } from '../hooks/useCanDisconnect'
import { useWifiList } from '../hooks/useWifiList'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'
import { SECURITY_WPA_EAP, WifiNetwork } from '@opentrons/api-client'

jest.mock('../hooks/useWifiList')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../redux/discovery')

const mockGetRobotApiVersionByName = getRobotApiVersionByName as jest.MockedFunction<
  typeof getRobotApiVersionByName
>
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>

const store: Store<State> = createStore(state => state, {})

const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
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
    when(mockUseIsFlex).calledWith('otie').mockReturnValue(false)
  })
  afterEach(() => resetAllWhenMocks())

  it('useCanDisconnect returns true if active network, robot >= 3.17', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: true }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('useCanDisconnect returns false if no list in state', () => {
    when(useWifiList).calledWith('otie').mockReturnValue([])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns false if no active network', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: false }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns false if less than 3.17.0', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: true }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('3.16.999')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns true for an OT-3', () => {
    when(useWifiList)
      .calledWith('otie')
      .mockReturnValue([{ ...mockWifiNetwork, active: true }])

    when(mockGetRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .mockReturnValue('0.22.999-gamma.1')

    when(mockUseIsFlex).calledWith('otie').mockReturnValue(true)

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('useCanDisconnect returns false if robot API version not found', () => {
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
