import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
  usePipettesQuery,
} from '@opentrons/react-api-client'

import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
} from '../../../../redux/calibration/tip-length/__fixtures__'

import { useAttachedPipetteCalibrations } from '..'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../redux/calibration')
jest.mock('../../../../redux/pipettes')
jest.mock('../../../../redux/robot-api')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockUseAllPipetteOffsetCalibrationsQuery = useAllPipetteOffsetCalibrationsQuery as jest.MockedFunction<
  typeof useAllPipetteOffsetCalibrationsQuery
>
const mockUseAllTipLengthCalibrationsQuery = useAllTipLengthCalibrationsQuery as jest.MockedFunction<
  typeof useAllTipLengthCalibrationsQuery
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

describe('useAttachedPipetteCalibrations hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
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

  it('returns attached pipette calibrations when given a robot name', () => {
    when(mockUsePipettesQuery)
      .calledWith({}, {})
      .mockReturnValue({
        data: {
          left: {
            id: mockPipetteOffsetCalibration1.pipette,
            name: 'p300_single_gen2',
            model: 'p300_single_v2.1',
            tip_length: 50,
            mount_axis: 'z',
            plunger_axis: 'b',
          },
          right: {
            id: mockPipetteOffsetCalibration2.pipette,
            name: 'p20_single_gen2',
            model: 'p20_single_v2.1',
            tip_length: 50,
            mount_axis: 'z',
            plunger_axis: 'b',
          },
        },
      } as any)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith()
      .mockReturnValue({
        data: {
          data: [mockPipetteOffsetCalibration1, mockPipetteOffsetCalibration2],
        },
      } as any)
    when(mockUseAllTipLengthCalibrationsQuery)
      .calledWith()
      .mockReturnValue({
        data: {
          data: [mockTipLengthCalibration1, mockTipLengthCalibration2],
        },
      } as any)

    const { result } = renderHook(() => useAttachedPipetteCalibrations(), {
      wrapper,
    })

    expect(result.current).toEqual(PIPETTE_CALIBRATIONS)
  })
})
