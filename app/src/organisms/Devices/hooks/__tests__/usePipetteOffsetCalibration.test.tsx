import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'

import {
  fetchPipetteOffsetCalibrations,
  getCalibrationForPipette,
} from '../../../../redux/calibration'
import { mockPipetteOffsetCalibration1 } from '../../../../redux/calibration/pipette-offset/__fixtures__'
import { useDispatchApiRequest } from '../../../../redux/robot-api'
import { useRobot } from '../useRobot'
import { usePipetteOffsetCalibration } from '..'

import type { DiscoveredRobot } from '../../../../redux/discovery/types'
import type { DispatchApiRequestType } from '../../../../redux/robot-api'
import { AttachedPipette, Mount } from '../../../../redux/pipettes/types'

jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/robot-api')
jest.mock('../useRobot')

const mockFetchPipetteOffsetCalibrations = fetchPipetteOffsetCalibrations as jest.MockedFunction<
  typeof fetchPipetteOffsetCalibrations
>
const mockGetCalibrationForPipette = getCalibrationForPipette as jest.MockedFunction<
  typeof getCalibrationForPipette
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const store: Store<any> = createStore(jest.fn(), {})

const ROBOT_NAME = 'otie'
const PIPETTE_ID = 'pipetteId' as AttachedPipette['id']
const MOUNT = 'left' as Mount

describe('usePipetteOffsetCalibration hook', () => {
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
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(({ status: 'chill' } as unknown) as DiscoveredRobot)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no pipette offset calibration when given a null robot name and null pipette id', () => {
    mockGetCalibrationForPipette.mockReturnValue(null)

    const { result } = renderHook(
      () => usePipetteOffsetCalibration(null, null, MOUNT),
      {
        wrapper,
      }
    )

    expect(result.current).toEqual(null)
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns pipette offset calibration when given a robot name, pipette id, and mount', () => {
    when(mockGetCalibrationForPipette)
      .calledWith(undefined as any, ROBOT_NAME, PIPETTE_ID, MOUNT)
      .mockReturnValue(mockPipetteOffsetCalibration1)

    const { result } = renderHook(
      () => usePipetteOffsetCalibration(ROBOT_NAME, PIPETTE_ID, MOUNT),
      {
        wrapper,
      }
    )

    expect(result.current).toEqual(mockPipetteOffsetCalibration1)
    expect(dispatchApiRequest).toBeCalledWith(
      mockFetchPipetteOffsetCalibrations(ROBOT_NAME)
    )
  })
})
