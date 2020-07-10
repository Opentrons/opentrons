// @flow

import * as Fixtures from '../__fixtures__'
import * as StatusFixtures from '../../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../../types'

describe('labware calibration selectors', () => {
  it('should return null if no robot in state', () => {
    const state: $Shape<State> = { calibration: {} }
    expect(Selectors.getListOfLabwareCalibrations(state, 'robotName')).toBe(
      null
    )
  })

  it('should return list of calibrations if in state', () => {
    const state: $Shape<State> = {
      calibration: {
        robotName: {
          calibrationStatus: StatusFixtures.mockCalibrationStatus,
          labwareCalibration: Fixtures.mockAllLabwareCalibraton,
        },
      },
    }
    expect(Selectors.getListOfLabwareCalibrations(state, 'robotName')).toEqual(
      Fixtures.mockAllLabwareCalibraton.data
    )
  })
})
