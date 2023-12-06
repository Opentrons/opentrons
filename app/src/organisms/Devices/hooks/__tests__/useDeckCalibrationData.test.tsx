import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useCalibrationStatusQuery } from '@opentrons/react-api-client'

import {
  DECK_CAL_STATUS_OK,
  DECK_CAL_STATUS_BAD_CALIBRATION,
  DECK_CAL_STATUS_IDENTITY,
} from '../../../../redux/calibration'
import { getDiscoverableRobotByName } from '../../../../redux/discovery'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'

import type { DispatchApiRequestType } from '../../../../redux/robot-api'

import { useDeckCalibrationData } from '..'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot-api')
jest.mock('../../../../redux/discovery')

const mockGetDiscoverableRobotByName = getDiscoverableRobotByName as jest.MockedFunction<
  typeof getDiscoverableRobotByName
>

const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockUseCalibrationStatusQuery = useCalibrationStatusQuery as jest.MockedFunction<
  typeof useCalibrationStatusQuery
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useDeckCalibrationData hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>
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
    when(mockUseCalibrationStatusQuery)
      .calledWith({}, null)
      .mockReturnValue({
        data: {
          data: {
            deckCalibration: {
              data: mockDeckCalData,
              status: DECK_CAL_STATUS_IDENTITY,
            },
          },
        },
      } as any)

    const { result } = renderHook(() => useDeckCalibrationData(null), {
      wrapper,
    })

    expect(result.current).toEqual({
      deckCalibrationData: null,
      isDeckCalibrated: false,
      markedBad: false,
    })
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns deck calibration data when given a robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockConnectableRobot)

    when(mockUseCalibrationStatusQuery)
      .calledWith({}, { hostname: mockConnectableRobot.ip })
      .mockReturnValue({
        data: {
          deckCalibration: {
            data: mockDeckCalData,
            status: DECK_CAL_STATUS_OK,
          },
        },
      } as any)

    const { result } = renderHook(() => useDeckCalibrationData('otie'), {
      wrapper,
    })

    expect(result.current).toEqual({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
      markedBad: false,
    })
  })

  it('returns markedBad deck calibration data when given a failed status', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockConnectableRobot)
    when(mockUseCalibrationStatusQuery)
      .calledWith({}, { hostname: mockConnectableRobot.ip })
      .mockReturnValue({
        data: {
          deckCalibration: {
            data: mockDeckCalData,
            status: DECK_CAL_STATUS_BAD_CALIBRATION,
          },
        },
      } as any)

    const { result } = renderHook(() => useDeckCalibrationData('otie'), {
      wrapper,
    })

    expect(result.current).toEqual({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: false,
      markedBad: true,
    })
  })
})
