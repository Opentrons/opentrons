import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import {
  fetchTipLengthCalibrations,
  getTipLengthCalibrations,
} from '../../../../redux/calibration'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import { useTipLengthCalibrations } from '..'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot-api')

const mockFetchTipLengthCalibrations = fetchTipLengthCalibrations as jest.MockedFunction<
  typeof fetchTipLengthCalibrations
>
const mockGetTipLengthCalibrations = getTipLengthCalibrations as jest.MockedFunction<
  typeof getTipLengthCalibrations
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useTipLengthCalibrations hook', () => {
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

  it('returns no tip length calibrations when given a null robot name', () => {
    when(mockGetTipLengthCalibrations)
      .calledWith(undefined as any, null)
      .mockReturnValue([])

    const { result } = renderHook(() => useTipLengthCalibrations(null), {
      wrapper,
    })

    expect(result.current).toEqual([])
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns tip length calibrations when given a robot name', () => {
    when(mockGetTipLengthCalibrations)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue([
        mockTipLengthCalibration1,
        mockTipLengthCalibration2,
        mockTipLengthCalibration3,
      ])

    const { result } = renderHook(() => useTipLengthCalibrations('otie'), {
      wrapper,
    })

    expect(result.current).toEqual([
      mockTipLengthCalibration1,
      mockTipLengthCalibration2,
      mockTipLengthCalibration3,
    ])
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchTipLengthCalibrations('otie')
    )
  })
})
