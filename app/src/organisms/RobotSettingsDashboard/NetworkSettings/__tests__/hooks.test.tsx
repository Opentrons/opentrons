import * as React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

import { getOnDeviceDisplaySettings } from '../../../../redux/config'
import { useIsFinishedUnboxing } from '../hooks'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/config')

const mockGetOnDeviceDisplaySettings = getOnDeviceDisplaySettings as jest.MockedFunction<
  typeof getOnDeviceDisplaySettings
>

const store: Store<State> = createStore(jest.fn(), {})

const mockDisplaySettings = {
  sleepMs: 604800000,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: null,
}

describe('useIsFinishedUnboxing', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
    mockGetOnDeviceDisplaySettings.mockReturnValue(mockDisplaySettings)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return true if unfinishedUnboxingFlowRoute is /welcome', () => {
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      ...mockDisplaySettings,
      unfinishedUnboxingFlowRoute: '/welcome',
    })
    const { result } = renderHook(() => useIsFinishedUnboxing(), { wrapper })
    expect(result.current).toBe(true)
  })

  it('should return true if unfinishedUnboxingFlowRoute is /robot-settings/rename-robot', () => {
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      ...mockDisplaySettings,
      unfinishedUnboxingFlowRoute: '/robot-settings/rename-robot',
    })
    const { result } = renderHook(() => useIsFinishedUnboxing(), { wrapper })
    expect(result.current).toBe(true)
  })

  it('should return false if unfinishedUnboxingFlowRoute is null', () => {
    const { result } = renderHook(() => useIsFinishedUnboxing(), { wrapper })
    expect(result.current).toBe(false)
  })
})
