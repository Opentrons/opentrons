import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'
import { mockTipRackDefinition } from '../../../../redux/custom-labware/__fixtures__'

import {
  useRunCalibrationStatus,
  useDeckCalibrationStatus,
  useRunPipetteInfoByMount,
} from '..'

import type { PipetteInfo } from '..'

jest.mock('../useDeckCalibrationStatus')
jest.mock('../useRunPipetteInfoByMount')

const mockUseDeckCalibrationStatus = useDeckCalibrationStatus as jest.MockedFunction<
  typeof useDeckCalibrationStatus
>
const mockUseRunPipetteInfoByMount = useRunPipetteInfoByMount as jest.MockedFunction<
  typeof useRunPipetteInfoByMount
>

describe('useRunCalibrationStatus hook', () => {
  beforeEach(() => {
    when(mockUseDeckCalibrationStatus).calledWith('otie').mockReturnValue('OK')

    when(mockUseRunPipetteInfoByMount).calledWith('otie', '1').mockReturnValue({
      left: null,
      right: null,
    })
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return deck cal failure if not calibrated', () => {
    when(mockUseDeckCalibrationStatus)
      .calledWith('otie')
      .mockReturnValue('BAD_CALIBRATION')
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'))
    expect(result.current).toStrictEqual({
      complete: false,
      reason: 'calibrate_deck_failure_reason',
    })
  })
  it('should return attach pipette if missing', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('otie', '1')
      .mockReturnValue({
        left: {
          requestedPipetteMatch: 'incompatible',
          pipetteCalDate: null,
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: '',
              tipRackDef: mockTipRackDefinition,
            },
          ],
        } as PipetteInfo,
        right: null,
      })
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'))
    expect(result.current).toStrictEqual({
      complete: false,
      reason: 'attach_pipette_failure_reason',
    })
  })
  it('should return calibrate pipette if cal date null', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('otie', '1')
      .mockReturnValue({
        left: {
          requestedPipetteMatch: 'match',
          pipetteCalDate: null,
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: '',
              tipRackDef: mockTipRackDefinition,
            },
          ],
        } as PipetteInfo,
        right: null,
      })
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'))
    expect(result.current).toStrictEqual({
      complete: false,
      reason: 'calibrate_pipette_failure_reason',
    })
  })
  it('should return calibrate tip rack if cal date null', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('otie', '1')
      .mockReturnValue({
        left: {
          requestedPipetteMatch: 'match',
          pipetteCalDate: '2020-08-30T10:02',
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: null,
              tipRackDef: mockTipRackDefinition,
            },
          ],
        } as PipetteInfo,
        right: null,
      })
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'))
    expect(result.current).toStrictEqual({
      complete: false,
      reason: 'calibrate_tiprack_failure_reason',
    })
  })
  it('should return complete if everything is calibrated', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('otie', '1')
      .mockReturnValue({
        left: {
          requestedPipetteMatch: 'match',
          pipetteCalDate: '2020-08-30T10:02',
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: '2020-08-30T10:02',
              tipRackDef: mockTipRackDefinition,
            },
          ],
        } as PipetteInfo,
        right: null,
      })
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'))
    expect(result.current).toStrictEqual({
      complete: true,
    })
  })
})
