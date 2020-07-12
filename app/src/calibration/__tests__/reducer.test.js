// @flow

import * as Fixtures from '../__fixtures__'
import * as LabwareFixtures from '../labware/__fixtures__'
import { labware as LabwareFunctions } from '../'
import * as Actions from '../actions'
import { calibrationReducer } from '../reducer'

describe('calibration reducer', () => {
  it('should handle a FETCH_CALIBRATION_STATUS_SUCCESS', () => {
    const action = Actions.fetchCalibrationStatusSuccess(
      'robot-name',
      Fixtures.mockCalibrationStatus,
      {}
    )

    expect(calibrationReducer({}, action)).toEqual({
      'robot-name': { calibrationStatus: Fixtures.mockCalibrationStatus },
    })
  })
  it('should handle a FETCH_LABWARE_CALIBRATION_SUCCESS', () => {
    const action = LabwareFunctions.fetchLabwareCalibrationSuccess(
      'robot-name',
      LabwareFixtures.mockAllLabwareCalibraton,
      {}
    )

    expect(calibrationReducer({}, action)).toEqual({
      'robot-name': {
        labwareCalibration: LabwareFixtures.mockAllLabwareCalibraton,
      },
    })
  })
})
