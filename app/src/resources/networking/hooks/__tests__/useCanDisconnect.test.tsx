import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SECURITY_WPA_EAP } from '@opentrons/api-client'

import { useIsFlex } from '/app/redux-resources/robots'
import { getRobotApiVersionByName } from '/app/redux/discovery'

import { useCanDisconnect } from '../useCanDisconnect'
import { useWifiList } from '../useWifiList'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { WifiNetwork } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

vi.mock('../useWifiList')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/discovery')

const store: Store<State> = legacy_createStore(state => state, {})

const wrapper: FunctionComponent<{ children: ReactNode }> = ({ children }) => (
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
    vi.when(useWifiList).calledWith('otie').thenReturn([])
    vi.when(useIsFlex).calledWith('otie').thenReturn(false)
  })

  it('useCanDisconnect returns true if active network, robot >= 3.17', () => {
    vi.when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    vi.when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('useCanDisconnect returns false if no list in state', () => {
    vi.when(useWifiList).calledWith('otie').thenReturn([])

    vi.when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns false if no active network', () => {
    vi.when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: false }])

    vi.when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns false if less than 3.17.0', () => {
    vi.when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    vi.when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.16.999')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns true for a Flex', () => {
    vi.when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    vi.when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('0.22.999-gamma.1')

    vi.when(useIsFlex).calledWith('otie').thenReturn(true)

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('useCanDisconnect returns false if robot API version not found', () => {
    vi.when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    vi.when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn(null)

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })
})
