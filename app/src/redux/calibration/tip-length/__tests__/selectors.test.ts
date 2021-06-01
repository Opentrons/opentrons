import * as Selectors from '../selectors'
import * as Fixtures from '../__fixtures__'

import type { State } from '../../../types'

const mockState: State = {
  calibration: {
    'robot-name': {
      tipLengthCalibrations: Fixtures.mockAllTipLengthCalibrations,
      pipetteOffsetCalibrations: null,
      labwareCalibrations: null,
      calibrationStatus: null,
    },
  },
} as any

describe('getTipLengthCalibrations', () => {
  it('should find all tip length calibrations when they exist', () => {
    expect(
      Selectors.getTipLengthCalibrations(mockState, 'robot-name')
    ).toEqual([
      Fixtures.mockTipLengthCalibration1,
      Fixtures.mockTipLengthCalibration2,
      Fixtures.mockTipLengthCalibration3,
    ])
  })
  it('should not find calibrations from other robots', () => {
    expect(
      Selectors.getTipLengthCalibrations(mockState, 'other-robot')
    ).toEqual([])
  })
})

describe('getCalibrationForPipette', () => {
  it('should get the calibration for a specific pipette and tiprack if it exists', () => {
    expect(
      Selectors.getTipLengthForPipetteAndTiprack(
        mockState,
        'robot-name',
        'P20MV2008052020A02',
        'opentrons_96_tiprack_20ul_hash'
      )
    ).toEqual(Fixtures.mockTipLengthCalibration3)
  })
  it('should get no calibration when no matching calibration exists', () => {
    expect(
      Selectors.getTipLengthForPipetteAndTiprack(
        mockState,
        'robot-name',
        'no such pipette',
        'opentrons_96_tiprack_20ul_hash'
      )
    ).toBeNull()
  })
  it('should get no calibration from the wrong robot', () => {
    expect(
      Selectors.getTipLengthForPipetteAndTiprack(
        mockState,
        'some other robot',
        'P20MV2008052020A02',
        'opentrons_96_tiprack_20ul_hash'
      )
    ).toBeNull()
  })
})
