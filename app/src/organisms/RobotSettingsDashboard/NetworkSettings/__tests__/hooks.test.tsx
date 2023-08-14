import * as React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import {
  getIsOnDevice,
  getOnDeviceDisplaySettings,
} from '../../../../redux/config'
import { useIsUnboxingFlowOngoing } from '../hooks'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/config')

const mockGetOnDeviceDisplaySettings = getOnDeviceDisplaySettings as jest.MockedFunction<
  typeof getOnDeviceDisplaySettings
>

const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>

const store: Store<State> = createStore(jest.fn(), {})

const mockDisplaySettings = {
  sleepMs: 604800000,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: null,
}

describe('useIsUnboxingFlowOngoing', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
    mockGetOnDeviceDisplaySettings.mockReturnValue(mockDisplaySettings)
    mockGetIsOnDevice.mockReturnValue(true)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return true if unfinishedUnboxingFlowRoute is /welcome', () => {
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      ...mockDisplaySettings,
      unfinishedUnboxingFlowRoute: '/welcome',
    })
    const { result } = renderHook(() => useIsUnboxingFlowOngoing(), {
      wrapper,
    })
    expect(result.current).toBe(true)
  })

  it('should return true if unfinishedUnboxingFlowRoute is /emergency-stop', () => {
    mockGetOnDeviceDisplaySettings.mockReturnValue({
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
