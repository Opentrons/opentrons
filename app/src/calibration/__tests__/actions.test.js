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

describe('robot calibration check actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'calibration:ROBOT_CALIBRATION_CHECK_COMPARE_POINT',
      creator: Actions.completeRobotCalibrationCheck,
      args: ['robot-name'],
      expected: {
        type: 'calibration:COMPLETE_ROBOT_CALIBRATION_CHECK',
        payload: {
          robotName: 'robot-name',
        },
        meta: {},
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
