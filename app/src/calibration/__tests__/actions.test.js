// @flow

import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import type { CalibrationAction } from '../types'

type ActionSpec = {|
  should: string,
  creator: (...Array<any>) => CalibrationAction,
  args: Array<mixed>,
  expected: CalibrationAction,
|}

const SPECS: Array<ActionSpec> = [
  {
    should: 'create a fetchCalibrationStatus action',
    creator: Actions.fetchCalibrationStatus,
    args: ['robot-name'],
    expected: {
      type: 'calibration:FETCH_CALIBRATION_STATUS',
      payload: { robotName: 'robot-name' },
      meta: {},
    },
  },
  {
    should: 'create a fetchCalibrationStatusSuccess action',
    creator: Actions.fetchCalibrationStatusSuccess,
    args: [
      'robot-name',
      Fixtures.mockFetchCalibrationStatusSuccess.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_CALIBRATION_STATUS_SUCCESS',
      payload: {
        robotName: 'robot-name',
        calibrationStatus: Fixtures.mockCalibrationStatus,
      },
      meta: { requestId: '123' },
    },
  },
  {
    should: 'create a fetchCalibrationStatusFailure action',
    creator: Actions.fetchCalibrationStatusFailure,
    args: [
      'robot-name',
      Fixtures.mockFetchCalibrationStatusFailure.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_CALIBRATION_STATUS_FAILURE',
      payload: {
        robotName: 'robot-name',
        error: Fixtures.mockFetchCalibrationStatusFailure.body,
      },
      meta: { requestId: '123' },
    },
  },
]

describe('calibration actions', () => {
  SPECS.forEach(({ should, creator, args, expected }) => {
    it(should, () => {
      expect(creator(...args)).toEqual(expected)
    })
  })
})
