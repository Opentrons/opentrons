import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from 'react-query'

import {
  fetchCalibrationStatus,
  getDeckCalibrationData,
  DECK_CAL_STATUS_OK,
  DECK_CAL_STATUS_IDENTITY,
} from '../../../../redux/calibration'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

import { useDeckCalibrationData, useDeckCalibrationStatus } from '..'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot-api')
jest.mock('../useDeckCalibrationStatus')

const mockFetchCalibrationStatus = fetchCalibrationStatus as jest.MockedFunction<
  typeof fetchCalibrationStatus
>
const mockGetDeckCalibrationData = getDeckCalibrationData as jest.MockedFunction<
  typeof getDeckCalibrationData
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockUseDeckCalibrationStatus = useDeckCalibrationStatus as jest.MockedFunction<
  typeof useDeckCalibrationStatus
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

    when(mockUseDeckCalibrationStatus)
      .calledWith(null)
      .mockReturnValue(DECK_CAL_STATUS_IDENTITY)

    const { result } = renderHook(() => useDeckCalibrationData(null), {
      wrapper,
    })

    expect(result.current).toEqual({
      deckCalibrationData: null,
      isDeckCalibrated: false,
    })
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns deck calibration data when given a robot name', () => {
    when(mockGetDeckCalibrationData)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockDeckCalData)

    when(mockUseDeckCalibrationStatus)
      .calledWith('otie')
      .mockReturnValue(DECK_CAL_STATUS_OK)

    const { result } = renderHook(() => useDeckCalibrationData('otie'), {
      wrapper,
    })

    expect(result.current).toEqual({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchCalibrationStatus('otie')
    )
  })
})
