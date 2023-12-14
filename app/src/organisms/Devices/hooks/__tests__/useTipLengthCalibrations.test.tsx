import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react'
import { useAllTipLengthCalibrationsQuery } from '@opentrons/react-api-client'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
  mockTipLengthCalibration3,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import { useTipLengthCalibrations } from '..'

jest.mock('@opentrons/react-api-client')

const mockUseAllTipLengthCalibrationsQuery = useAllTipLengthCalibrationsQuery as jest.MockedFunction<
  typeof useAllTipLengthCalibrationsQuery
>

const CALIBRATIONS_FETCH_MS = 5000

describe('useTipLengthCalibrations hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    afterEach(() => {
      resetAllWhenMocks()
      jest.resetAllMocks()
    })
  })

  it('returns an empty array when no tip length calibrations found', () => {
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({
        refetchInterval: CALIBRATIONS_FETCH_MS,
      })
      .mockReturnValue(null as any)

    const { result } = renderHook(() => useTipLengthCalibrations(), {
      wrapper,
    })

    expect(result.current).toEqual([])
  })

  it('returns tip length calibrations when found', () => {
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith({
        refetchInterval: CALIBRATIONS_FETCH_MS,
      })
      .mockReturnValue({
        data: {
          data: [
            mockTipLengthCalibration1,
            mockTipLengthCalibration2,
            mockTipLengthCalibration3,
          ],
        },
      } as any)

    const { result } = renderHook(() => useTipLengthCalibrations(), {
      wrapper,
    })

    expect(result.current).toEqual([
      mockTipLengthCalibration1,
      mockTipLengthCalibration2,
      mockTipLengthCalibration3,
    ])
  })
})
