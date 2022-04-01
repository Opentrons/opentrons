import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import {
  fetchPipetteOffsetCalibrations,
  getPipetteOffsetCalibrations,
} from '../../../../redux/calibration'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import { usePipetteOffsetCalibrations } from '..'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot-api')

const mockFetchPipetteOffsetCalibrations = fetchPipetteOffsetCalibrations as jest.MockedFunction<
  typeof fetchPipetteOffsetCalibrations
>
const mockGetPipetteOffsetCalibrations = getPipetteOffsetCalibrations as jest.MockedFunction<
  typeof getPipetteOffsetCalibrations
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

describe('usePipetteOffsetCalibrations hook', () => {
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

  it('returns no pipette offset calibrations when given a null robot name', () => {
    when(mockGetPipetteOffsetCalibrations)
      .calledWith(undefined as any, null)
      .mockReturnValue([])

    const { result } = renderHook(() => usePipetteOffsetCalibrations(null), {
      wrapper,
    })

    expect(result.current).toEqual([])
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns pipette offset calibrations when given a robot name', () => {
    when(mockGetPipetteOffsetCalibrations)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue([
        mockPipetteOffsetCalibration1,
        mockPipetteOffsetCalibration2,
        mockPipetteOffsetCalibration3,
      ])

    const { result } = renderHook(() => usePipetteOffsetCalibrations('otie'), {
      wrapper,
    })

    expect(result.current).toEqual([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchPipetteOffsetCalibrations('otie')
    )
  })
})
