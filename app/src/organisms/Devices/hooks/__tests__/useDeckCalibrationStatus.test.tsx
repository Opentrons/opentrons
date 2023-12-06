import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useCalibrationStatusQuery } from '@opentrons/react-api-client'

import { DECK_CAL_STATUS_OK } from '../../../../redux/calibration'
import { getDiscoverableRobotByName } from '../../../../redux/discovery'

import { useDeckCalibrationStatus } from '..'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/discovery')

const mockGetDiscoverableRobotByName = getDiscoverableRobotByName as jest.MockedFunction<
  typeof getDiscoverableRobotByName
>
const mockUseCalibrationStatusQuery = useCalibrationStatusQuery as jest.MockedFunction<
  typeof useCalibrationStatusQuery
>

const store: Store<any> = createStore(jest.fn(), {})

describe('useDeckCalibrationStatus hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no deck calibration status when no robot provided', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'null')
      .mockReturnValue(null)
    when(mockUseCalibrationStatusQuery)
      .calledWith({}, null)
      .mockReturnValue({ data: null } as any)

    const { result } = renderHook(() => useDeckCalibrationStatus(null), {
      wrapper,
    })

    expect(result.current).toEqual(null)
  })

  it('returns deck calibration status when given a robot name', () => {
    when(mockGetDiscoverableRobotByName)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockConnectableRobot)
    when(mockUseCalibrationStatusQuery)
      .calledWith({}, { hostname: mockConnectableRobot.ip })
      .mockReturnValue({
        data: { deckCalibration: { status: DECK_CAL_STATUS_OK } },
      } as any)

    const { result } = renderHook(() => useDeckCalibrationStatus('otie'), {
      wrapper,
    })

    expect(result.current).toEqual('OK')
  })
})
