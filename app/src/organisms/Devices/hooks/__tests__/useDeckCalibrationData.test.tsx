import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import {
  fetchCalibrationStatus,
  getDeckCalibrationData,
} from '../../../../redux/calibration'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

import { useDeckCalibrationData } from '..'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot-api')

const mockFetchCalibrationStatus = fetchCalibrationStatus as jest.MockedFunction<
  typeof fetchCalibrationStatus
>
const mockGetDeckCalibrationData = getDeckCalibrationData as jest.MockedFunction<
  typeof getDeckCalibrationData
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useDeckCalibrationData hook', () => {
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

  it('returns no deck calibration data when given a null robot name', () => {
    when(mockGetDeckCalibrationData)
      .calledWith(undefined as any, null)
      .mockReturnValue(null)

    const { result } = renderHook(() => useDeckCalibrationData(null), {
      wrapper,
    })

    expect(result.current).toEqual(null)
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns deck calibration data when given a robot name', () => {
    when(mockGetDeckCalibrationData)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockDeckCalData)

    const { result } = renderHook(() => useDeckCalibrationData('otie'), {
      wrapper,
    })

    expect(result.current).toEqual(mockDeckCalData)
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchCalibrationStatus('otie')
    )
  })
})
