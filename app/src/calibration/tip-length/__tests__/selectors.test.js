// @flow

import * as Selectors from '../selectors'
import * as Fixtures from '../__fixtures__'

import type { State } from '../../../types'

const mockState: $Shape<State> = {
  calibration: {
    'robot-name': {
      tipLengthCalibrations: Fixtures.mockAllTipLengthCalibrations,
      pipetteOffsetCalibrations: null,
      labwareCalibrations: null,
      calibrationStatus: null,
    },
  },
}

describe('getTipLengthCalibrations', () => {
  it('should find all tip length calibrations when they exist', () => {
    expect(
      Selectors.getTipLengthCalibrations(mockState, 'robot-name')
    ).toEqual([
      Fixtures.mockTipLengthCalibration1.attributes,
      Fixtures.mockTipLengthCalibration2.attributes,
      Fixtures.mockTipLengthCalibration3.attributes,
    ])
  })
  it('should not find calibrations from other robots', () => {
    expect(
      Selectors.getTipLengthCalibrations(mockState, 'other-robot')
    ).toEqual([])
  })
})

describe('getCalibrationForPipette', () => {
  it('should get the calibration for a specific pipette if it exists', () => {
    expect(
      Selectors.getCalibrationForPipette(
        mockState,
        'robot-name',
        'P1KVS2108052020A02'
      )
    ).toEqual(Fixtures.mockTipLengthCalibration3.attributes)
  })
  it('should get no calibration when no matching calibration exists', () => {
    expect(
      Selectors.getCalibrationForPipette(
        mockState,
        'robot-name',
        'no such pipette'
      )
    ).toBeNull()
  })
  it('should get no calibration from the wrong robot', () => {
    expect(
      Selectors.getCalibrationForPipette(
        mockState,
        'some other robot',
        'P20MV2008052020A02'
      )
    ).toBeNull()
  })
})
