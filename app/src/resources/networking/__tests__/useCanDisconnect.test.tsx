import * as React from 'react'
import { when } from 'vitest-when'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { SECURITY_WPA_EAP, WifiNetwork } from '@opentrons/api-client'
import { renderHook } from '@testing-library/react'
import { getRobotApiVersionByName } from '../../../redux/discovery'

import { useIsFlex } from '../../../organisms/Devices/hooks'
import { useCanDisconnect } from '../hooks/useCanDisconnect'
import { useWifiList } from '../hooks/useWifiList'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'

vi.mock('../hooks/useWifiList')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../redux/discovery')

const store: Store<State> = createStore(state => state, {})

const wrapper: React.FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => <Provider store={store}>{children}</Provider>

const mockWifiNetwork: WifiNetwork = {
  ssid: 'linksys',
  signal: 50,
  active: false,
  security: 'WPA2 802.1X',
  securityType: SECURITY_WPA_EAP,
}

describe('useCanDisconnect', () => {
  beforeEach(() => {
    when(useWifiList).calledWith('otie').thenReturn([])
    when(useIsFlex).calledWith('otie').thenReturn(false)
  })

  it('useCanDisconnect returns true if active network, robot >= 3.17', () => {
    when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('useCanDisconnect returns false if no list in state', () => {
    when(useWifiList).calledWith('otie').thenReturn([])

    when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns false if no active network', () => {
    when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: false }])

    when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.17.0')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns false if less than 3.17.0', () => {
    when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('3.16.999')

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })

  it('useCanDisconnect returns true for a Flex', () => {
    when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn('0.22.999-gamma.1')

    when(useIsFlex).calledWith('otie').thenReturn(true)

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(true)
  })

  it('useCanDisconnect returns false if robot API version not found', () => {
    when(useWifiList)
      .calledWith('otie')
      .thenReturn([{ ...mockWifiNetwork, active: true }])

    when(getRobotApiVersionByName)
      .calledWith({} as any, 'otie')
      .thenReturn(null)

    const { result } = renderHook(() => useCanDisconnect('otie'), { wrapper })
    expect(result.current).toBe(false)
  })
})
