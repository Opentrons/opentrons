// @flow
import { robotControlsReducer } from '../reducer'

import type { Action } from '../../types'
import type { RobotControlsState } from '../types'

type ReducerSpec = {|
  name: string,
  state: RobotControlsState,
  action: Action,
  expected: RobotControlsState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles robotControls:FETCH_LIGHTS_SUCCESS',
    action: {
      type: 'robotControls:FETCH_LIGHTS_SUCCESS',
      payload: {
        robotName: 'robotName',
        lightsOn: true,
      },
      meta: {},
    },
    state: { robotName: { lightsOn: false } },
    expected: { robotName: { lightsOn: true } },
  },
  {
    name: 'handles robotControls:UPDATE_LIGHTS_SUCCESS',
    action: {
      type: 'robotControls:UPDATE_LIGHTS_SUCCESS',
      payload: {
        robotName: 'robotName',
        lightsOn: false,
      },
      meta: {},
    },
    state: { robotName: { lightsOn: true } },
    expected: { robotName: { lightsOn: false } },
  },
]

describe('robotControlsReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    test(name, () =>
      expect(robotControlsReducer(state, action)).toEqual(expected)
    )
  })
})
