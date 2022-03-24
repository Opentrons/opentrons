import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import {
  fetchPipetteOffsetCalibrations,
  fetchTipLengthCalibrations,
} from '../../../../redux/calibration'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import {
  fetchPipettes,
  getAttachedPipetteCalibrations,
} from '../../../../redux/pipettes'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

import { useAttachedPipetteCalibrations } from '..'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/pipettes')
jest.mock('../../../../redux/robot-api')

const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
  typeof fetchPipettes
>
const mockFetchPipetteOffsetCalibrations = fetchPipetteOffsetCalibrations as jest.MockedFunction<
  typeof fetchPipetteOffsetCalibrations
>
const mockFetchTipLengthCalibrations = fetchTipLengthCalibrations as jest.MockedFunction<
  typeof fetchTipLengthCalibrations
>
const mockGetAttachedPipetteCalibrations = getAttachedPipetteCalibrations as jest.MockedFunction<
  typeof getAttachedPipetteCalibrations
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})

const PIPETTE_CALIBRATIONS = {
  left: {
    offset: mockPipetteOffsetCalibration1,
    tipLength: mockTipLengthCalibration1,
  },
  right: {
    offset: mockPipetteOffsetCalibration2,
    tipLength: mockTipLengthCalibration2,
  },
}

const NULL_PIPETTE_CALIBRATIONS = {
  left: {
    offset: null,
    tipLength: null,
  },
  right: {
    offset: null,
    tipLength: null,
  },
}

describe('useAttachedPipetteCalibrations hook', () => {
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

  it('returns no pipette calibrations when given a null robot name', () => {
    when(mockGetAttachedPipetteCalibrations)
      .calledWith(undefined as any, null)
      .mockReturnValue(NULL_PIPETTE_CALIBRATIONS)

    const { result } = renderHook(() => useAttachedPipetteCalibrations(null), {
      wrapper,
    })

    expect(result.current).toEqual(NULL_PIPETTE_CALIBRATIONS)
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns attached pipette calibrations when given a robot name', () => {
    when(mockGetAttachedPipetteCalibrations)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(PIPETTE_CALIBRATIONS)

    const { result } = renderHook(
      () => useAttachedPipetteCalibrations('otie'),
      {
        wrapper,
      }
    )

    expect(result.current).toEqual(PIPETTE_CALIBRATIONS)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchPipetteOffsetCalibrations('otie')
    )
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchTipLengthCalibrations('otie')
    )
  })
})
