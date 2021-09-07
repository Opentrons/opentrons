import * as Selectors from '../selectors'
import * as Fixtures from '../__fixtures__'

import type { State } from '../../../types'

const mockState: State = {
  calibration: {
    'robot-name': {
      pipetteOffsetCalibrations: Fixtures.mockAllPipetteOffsetsCalibration,
      labwareCalibrations: null,
      calibrationStatus: null,
      tipLengthCalibrations: null,
    },
  },
} as any

describe('getPipetteOffsetCalibrations', () => {
  it('should find all pipette calibrations when they exist', () => {
    expect(
      Selectors.getPipetteOffsetCalibrations(mockState, 'robot-name')
    ).toEqual([
      Fixtures.mockPipetteOffsetCalibration1,
      Fixtures.mockPipetteOffsetCalibration2,
      Fixtures.mockPipetteOffsetCalibration3,
    ])
  })
  it('should not find calibrations from other robots', () => {
    expect(
      Selectors.getPipetteOffsetCalibrations(mockState, 'other-robot')
    ).toEqual([])
  })
})

describe('getCalibrationForPipette', () => {
  it('should get the calibration for a specific pipette if it exists', () => {
    expect(
      Selectors.getCalibrationForPipette(
        mockState,
        'robot-name',
        'P1KVS2108052020A02',
        'right'
      )
    ).toEqual(Fixtures.mockPipetteOffsetCalibration3)
  })
  it('should get no calibration when no matching calibration exists', () => {
    expect(
      Selectors.getCalibrationForPipette(
        mockState,
        'robot-name',
        'no such pipette',
        'some mount'
      )
    ).toBeNull()
  })
  it('should get no calibration from the wrong robot', () => {
    expect(
      Selectors.getCalibrationForPipette(
        mockState,
        'some other robot',
        'P20MV2008052020A02',
        'right'
      )
    ).toBeNull()
  })
})
