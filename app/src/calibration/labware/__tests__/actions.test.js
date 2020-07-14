// @flow

import * as Fixtures from '../__fixtures__'
import * as Actions from '../actions'
import type { LawareCalibrationAction } from '../types'

type ActionSpec = {|
  should: string,
  creator: (...Array<any>) => LawareCalibrationAction,
  args: Array<mixed>,
  expected: LawareCalibrationAction,
|}

const SPECS: Array<ActionSpec> = [
  {
    should: 'create a fetchCalibrationStatus action',
    creator: Actions.fetchAllLabwareCalibrations,
    args: ['robot-name'],
    expected: {
      type: 'calibration:FETCH_ALL_LABWARE_CALIBRATIONS',
      payload: { robotName: 'robot-name' },
      meta: {},
    },
  },
  {
    should: 'create a fetchCalibrationStatusSuccess action',
    creator: Actions.fetchLabwareCalibrationsSuccess,
    args: [
      'robot-name',
      Fixtures.mockFetchLabwareCalibrationSuccess.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_LABWARE_CALIBRATION_SUCCESS',
      payload: {
        robotName: 'robot-name',
        labwareCalibration: Fixtures.mockAllLabwareCalibraton,
      },
      meta: { requestId: '123' },
    },
  },
  {
    should: 'create a fetchCalibrationStatusFailure action',
    creator: Actions.fetchLabwareCalibrationsFailure,
    args: [
      'robot-name',
      Fixtures.mockFetchLabwareCalibrationFailure.body,
      { requestId: '123' },
    ],
    expected: {
      type: 'calibration:FETCH_LABWARE_CALIBRATION_FAILURE',
      payload: {
        robotName: 'robot-name',
        error: Fixtures.mockFetchLabwareCalibrationFailure.body,
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
