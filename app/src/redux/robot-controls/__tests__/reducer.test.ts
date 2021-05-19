import { robotControlsReducer } from '../reducer'

import type { Action } from '../../types'
import type { PerRobotControlsState } from '../types'

interface ReducerSpec {
  name: string
  state: Partial<{ [robotName: string]: Partial<PerRobotControlsState> }>
  action: Action
  expected: Partial<{ [robotName: string]: Partial<PerRobotControlsState> }>
}

const SPECS: ReducerSpec[] = [
  {
    name: 'handles robotControls:FETCH_LIGHTS_SUCCESS',
    action: {
      type: 'robotControls:FETCH_LIGHTS_SUCCESS',
      payload: {
        robotName: 'robotName',
        lightsOn: true,
      },
      meta: {} as any,
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
      meta: {} as any,
    },
    state: { robotName: { lightsOn: true } },
    expected: { robotName: { lightsOn: false } },
  },
  {
    name: 'handles robotControls:HOME',
    action: {
      type: 'robotControls:HOME',
      payload: { robotName: 'robotName', target: 'robot' },
      meta: {} as any,
    },
    state: { robotName: { movementStatus: null } },
    expected: { robotName: { movementStatus: 'homing', movementError: null } },
  },
  {
    name: 'handles robotControls:HOME_SUCCESS',
    action: {
      type: 'robotControls:HOME_SUCCESS',
      payload: { robotName: 'robotName' },
      meta: {} as any,
    },
    state: { robotName: { movementStatus: 'homing' } },
    expected: { robotName: { movementStatus: null, movementError: null } },
  },
  {
    name: 'handles robotControls:HOME_FAILURE',
    action: {
      type: 'robotControls:HOME_FAILURE',
      payload: { robotName: 'robotName', error: { message: 'AH' } },
      meta: {} as any,
    },
    state: { robotName: { movementStatus: 'homing' } },
    expected: {
      robotName: { movementStatus: 'homeError', movementError: 'AH' },
    },
  },
  {
    name: 'handles robotControls:MOVE',
    action: {
      type: 'robotControls:MOVE',
      payload: {
        robotName: 'robotName',
        position: 'attachTip',
        mount: 'left',
        disengageMotors: false,
      },
      meta: {} as any,
    },
    state: { robotName: { movementStatus: null } },
    expected: { robotName: { movementStatus: 'moving', movementError: null } },
  },
  {
    name: 'handles robotControls:MOVE_SUCCESS',
    action: {
      type: 'robotControls:MOVE_SUCCESS',
      payload: { robotName: 'robotName' },
      meta: {} as any,
    },
    state: { robotName: { movementStatus: 'moving' } },
    expected: { robotName: { movementStatus: null, movementError: null } },
  },
  {
    name: 'handles robotControls:MOVE_FAILURE',
    action: {
      type: 'robotControls:MOVE_FAILURE',
      payload: { robotName: 'robotName', error: { message: 'AH' } },
      meta: {} as any,
    },
    state: { robotName: { movementStatus: 'moving' } },
    expected: {
      robotName: { movementStatus: 'moveError', movementError: 'AH' },
    },
  },
  {
    name: 'handles robotControls:CLEAR_MOVEMENT_STATUS',
    action: {
      type: 'robotControls:CLEAR_MOVEMENT_STATUS',
      payload: { robotName: 'robotName' },
    },
    state: { robotName: { movementStatus: 'homeError', movementError: 'AH' } },
    expected: {
      robotName: { movementStatus: null, movementError: null },
    },
  },
]

describe('robotControlsReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () =>
      expect(robotControlsReducer(state as any, action)).toEqual(expected)
    )
  })
})
