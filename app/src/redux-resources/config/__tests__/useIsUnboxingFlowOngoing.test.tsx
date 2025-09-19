import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getIsOnDevice, getOnDeviceDisplaySettings } from '/app/redux/config'

import { useIsUnboxingFlowOngoing } from '../useIsUnboxingFlowOngoing'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '/app/redux/types'

vi.mock('/app/redux/config')

const store: Store<State> = legacy_createStore(vi.fn(), {})

const mockDisplaySettings = {
  sleepMs: 604800000,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: null,
}

describe('useIsUnboxingFlowOngoing', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  beforeEach(() => {
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue(mockDisplaySettings)
    vi.mocked(getIsOnDevice).mockReturnValue(true)
  })

  it('should return true if unfinishedUnboxingFlowRoute is /welcome', () => {
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue({
      ...mockDisplaySettings,
      unfinishedUnboxingFlowRoute: '/welcome',
    })
    const { result } = renderHook(() => useIsUnboxingFlowOngoing(), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('should return true if unfinishedUnboxingFlowRoute is /emergency-stop', () => {
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue({
      ...mockDisplaySettings,
      unfinishedUnboxingFlowRoute: '/emergency-stop',
    })
    const { result } = renderHook(() => useIsUnboxingFlowOngoing(), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('should return false if unfinishedUnboxingFlowRoute is null', () => {
    const { result } = renderHook(() => useIsUnboxingFlowOngoing(), {
      wrapper,
    })
    expect(result.current).toBe(false)
  })
})
