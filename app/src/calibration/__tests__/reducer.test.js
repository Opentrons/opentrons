// @flow

import * as Fixtures from '../__fixtures__'
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
})
