import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useAllPipetteOffsetCalibrationsQuery } from '@opentrons/react-api-client'
import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
  mockPipetteOffsetCalibration3,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import { usePipetteOffsetCalibrations } from '..'

jest.mock('@opentrons/react-api-client')

const mockUseAllPipetteOffsetCalibrationsQuery = useAllPipetteOffsetCalibrationsQuery as jest.MockedFunction<
  typeof useAllPipetteOffsetCalibrationsQuery
>

const CALIBRATION_DATA_POLL_MS = 5000

describe('usePipetteOffsetCalibrations hook', () => {
  let wrapper: React.FunctionComponent<{children: React.ReactNode}>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns empty array when no calibrations found', () => {
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: CALIBRATION_DATA_POLL_MS })
      .mockReturnValue(null as any)

    const { result } = renderHook(() => usePipetteOffsetCalibrations(), {
      wrapper,
    })

    expect(result.current).toEqual([])
  })

  it('returns pipette offset calibrations when calibrations found', () => {
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith({ refetchInterval: CALIBRATION_DATA_POLL_MS })
      .mockReturnValue({
        data: {
          data: [
            mockPipetteOffsetCalibration1,
            mockPipetteOffsetCalibration2,
            mockPipetteOffsetCalibration3,
          ],
        },
      } as any)

    const { result } = renderHook(() => usePipetteOffsetCalibrations(), {
      wrapper,
    })

    expect(result.current).toEqual([
      mockPipetteOffsetCalibration1,
      mockPipetteOffsetCalibration2,
      mockPipetteOffsetCalibration3,
    ])
  })
})
