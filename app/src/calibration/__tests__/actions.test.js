// @flow

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { CalibrationAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: CalibrationAction,
|}

describe('robot modules actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION',
      creator: Actions.createRobotCalibrationCheckSession,
      args: ['robot-name'],
      expected: {
        type: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION',
        payload: { robotName: 'robot-name' },
        meta: {},
      },
    },
    {
      name: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
      creator: Actions.createRobotCalibrationCheckSessionSuccess,
      args: [
        'robot-name',
        Fixtures.mockRobotCalibrationCheckSessionData,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
        payload: {
          robotName: 'robot-name',
          ...Fixtures.mockRobotCalibrationCheckSessionData,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE',
      creator: Actions.createRobotCalibrationCheckSessionFailure,
      args: [
        'robot-name',
        { message: 'Heck, your deck check wrecked!' },
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: { message: 'Heck, your deck check wrecked!' },
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION without recreating session',
      creator: Actions.deleteRobotCalibrationCheckSession,
      args: ['robot-name'],
      expected: {
        type: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION',
        payload: { robotName: 'robot-name', recreate: false },
        meta: {},
      },
    },
    {
      name: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION with recreating session',
      creator: Actions.deleteRobotCalibrationCheckSession,
      args: ['robot-name', true],
      expected: {
        type: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION',
        payload: { robotName: 'robot-name', recreate: true},
        meta: {},
      },
    },
    {
      name: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
      creator: Actions.deleteRobotCalibrationCheckSessionSuccess,
      args: [
        'robot-name',
        Fixtures.mockRobotCalibrationCheckSessionData,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS',
        payload: { robotName: 'robot-name' },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE',
      creator: Actions.deleteRobotCalibrationCheckSessionFailure,
      args: [
        'robot-name',
        {
          message: 'Heck, your deck check wreck attempt did not go as specced!',
        },
        { requestId: 'abc' },
      ],
      expected: {
        type: 'calibration:DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: {
            message:
              'Heck, your deck check wreck attempt did not go as specced!',
          },
        },
        meta: { requestId: 'abc' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
