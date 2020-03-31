// @flow
import * as Fixtures from '../__fixtures__'
import { calibrationReducer } from '../reducer'

import type { Action } from '../../types'
import type { CalibrationState } from '../types'

type ReducerSpec = {|
  name: string,
  state: CalibrationState,
  action: Action,
  expected: CalibrationState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
    action: {
      type: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
      payload: {
        robotName: 'terpentine-martini',
        ...Fixtures.mockRobotCalibrationCheckSessionData,
      },
      meta: {},
    },
    state: {
      'terpentine-martini': {
        robotCalibrationCheck: null,
      },
    },
    expected: {
      'terpentine-martini': {
        robotCalibrationCheck: Fixtures.mockRobotCalibrationCheckSessionData,
      },
    },
  },
  {
    name: 'handles calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
    action: {
      type: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
      payload: {
        robotName: 'terpentine-martini',
      },
      meta: {},
    },
    state: {
      'terpentine-martini': {
        robotCalibrationCheck: Fixtures.mockRobotCalibrationCheckSessionData,
      },
    },
    expected: {
      'terpentine-martini': {
        robotCalibrationCheck: null,
      },
    },
  },
]

describe('calibrationReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () => expect(calibrationReducer(state, action)).toEqual(expected))
  })
})
