import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import { useDispatchApiRequest } from '../../../../redux/robot-api'
import {
  fetchLights,
  updateLights,
  getLightsOn,
} from '../../../../redux/robot-controls'
import { useLights } from '..'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../../../../redux/robot-api')
jest.mock('../../../../redux/robot-controls')

const mockFetchLights = fetchLights as jest.MockedFunction<typeof fetchLights>
const mockGetLightsOn = getLightsOn as jest.MockedFunction<typeof getLightsOn>
const mockUpdateLights = updateLights as jest.MockedFunction<
  typeof updateLights
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useLights hook', () => {
  let dispatchApiRequest: DispatchApiRequestType

  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('toggles lights off when on', () => {
    when(mockGetLightsOn)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(true)

    const { result } = renderHook(() => useLights('otie'), { wrapper })

    expect(dispatchApiRequest).toBeCalledWith(mockFetchLights('otie'))
    expect(result.current.lightsOn).toEqual(true)
    result.current.toggleLights()
    expect(dispatchApiRequest).toBeCalledWith(mockUpdateLights('otie', false))
  })

  it('toggles lights on when off', () => {
    when(mockGetLightsOn)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(false)

    const { result } = renderHook(() => useLights('otie'), {
      wrapper,
    })

    expect(dispatchApiRequest).toBeCalledWith(mockFetchLights('otie'))
    expect(result.current.lightsOn).toEqual(false)
    result.current.toggleLights()
    expect(dispatchApiRequest).toBeCalledWith(mockUpdateLights('otie', true))
  })
})
