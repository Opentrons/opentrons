// @flow
import noop from 'lodash/noop'
import * as Fixtures from '../__fixtures__'
import * as Selectors from '../selectors'

import type { State } from '../../types'

jest.mock('../../robot/selectors')

type SelectorSpec = {|
  name: string,
  selector: (State, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  before?: () => mixed,
  expected: mixed,
|}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'getRobotCalibrationCheckSuccess returns null if no deck cal check session',
    selector: Selectors.getRobotCalibrationCheckSession,
    state: {
      calibration: {},
    },
    args: ['germanium-cobweb'],
    expected: null,
  },
  {
    name: 'getRobotCalibrationCheckSuccess returns ',
    selector: Selectors.getRobotCalibrationCheckSession,
    state: {
      calibration: {
        'germanium-cobweb': {
          robotCalibrationCheck: Fixtures.mockRobotCalibrationCheckSessionData,
        },
      },
    },
    args: ['germanium-cobweb'],
    expected: Fixtures.mockRobotCalibrationCheckSessionData,
  },
]

describe('calibration selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], before = noop, expected } = spec
    it(name, () => {
      before()
      expect(selector(state, ...args)).toEqual(expected)
    })
  })
})
