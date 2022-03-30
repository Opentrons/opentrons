import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import {
  fetchCalibrationStatus,
  getDeckCalibrationStatus,
} from '../../../../redux/calibration'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

import { useDeckCalibrationStatus } from '..'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot-api')

const mockFetchCalibrationStatus = fetchCalibrationStatus as jest.MockedFunction<
  typeof fetchCalibrationStatus
>
const mockGetDeckCalibrationStatus = getDeckCalibrationStatus as jest.MockedFunction<
  typeof getDeckCalibrationStatus
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useDeckCalibrationStatus hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no deck calibration status when given a null robot name', () => {
    when(mockGetDeckCalibrationStatus)
      .calledWith(undefined as any, null)
      .mockReturnValue(null)

    const { result } = renderHook(() => useDeckCalibrationStatus(null), {
      wrapper,
    })

    expect(result.current).toEqual(null)
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns deck calibration status when given a robot name', () => {
    when(mockGetDeckCalibrationStatus)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue('OK')

    const { result } = renderHook(() => useDeckCalibrationStatus('otie'), {
      wrapper,
    })

    expect(result.current).toEqual('OK')
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchCalibrationStatus('otie')
    )
  })
})
