// @flow

import * as Actions from '../actions'

import type { RobotControlsAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: RobotControlsAction,
|}

const SPECS: Array<ActionSpec> = [
  {
    name: 'robotControls:FETCH_LIGHTS',
    creator: Actions.fetchLights,
    args: ['robot-name'],
    expected: {
      type: 'robotControls:FETCH_LIGHTS',
      payload: { robotName: 'robot-name' },
      meta: {},
    },
  },
  {
    name: 'robotControls:FETCH_LIGHTS_SUCCESS',
    creator: Actions.fetchLightsSuccess,
    args: ['robot-name', true, { requestId: 'abc' }],
    expected: {
      type: 'robotControls:FETCH_LIGHTS_SUCCESS',
      payload: {
        robotName: 'robot-name',
        lightsOn: true,
      },
      meta: { requestId: 'abc' },
    },
  },
  {
    name: 'robotControls:FETCH_LIGHTS_FAILURE',
    creator: Actions.fetchLightsFailure,
    args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
    expected: {
      type: 'robotControls:FETCH_LIGHTS_FAILURE',
      payload: {
        robotName: 'robot-name',
        error: { message: 'AH' },
      },
      meta: { requestId: 'abc' },
    },
  },
  {
    name: 'robotControls:UPDATE_LIGHTS',
    creator: Actions.updateLights,
    args: ['robot-name', true],
    expected: {
      type: 'robotControls:UPDATE_LIGHTS',
      payload: { robotName: 'robot-name', lightsOn: true },
      meta: {},
    },
  },
  {
    name: 'robotControls:UPDATE_LIGHTS_SUCCESS',
    creator: Actions.updateLightsSuccess,
    args: ['robot-name', true, { requestId: 'abc' }],
    expected: {
      type: 'robotControls:UPDATE_LIGHTS_SUCCESS',
      payload: {
        robotName: 'robot-name',
        lightsOn: true,
      },
      meta: { requestId: 'abc' },
    },
  },
  {
    name: 'robotControls:UPDATE_LIGHTS_FAILURE',
    creator: Actions.updateLightsFailure,
    args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
    expected: {
      type: 'robotControls:UPDATE_LIGHTS_FAILURE',
      payload: {
        robotName: 'robot-name',
        error: { message: 'AH' },
      },
      meta: { requestId: 'abc' },
    },
  },
  {
    name: 'robotControls:HOME robot',
    creator: Actions.home,
    args: ['robot-name', 'robot'],
    expected: {
      type: 'robotControls:HOME',
      payload: { robotName: 'robot-name', target: 'robot' },
      meta: {},
    },
  },
  {
    name: 'robotControls:HOME pipette',
    creator: Actions.home,
    args: ['robot-name', 'pipette', 'left'],
    expected: {
      type: 'robotControls:HOME',
      payload: { robotName: 'robot-name', target: 'pipette', mount: 'left' },
      meta: {},
    },
  },
  {
    name: 'robotControls:HOME_SUCCESS',
    creator: Actions.homeSuccess,
    args: ['robot-name', { requestId: 'abc' }],
    expected: {
      type: 'robotControls:HOME_SUCCESS',
      payload: { robotName: 'robot-name' },
      meta: { requestId: 'abc' },
    },
  },
  {
    name: 'robotControls:HOME_FAILURE',
    creator: Actions.homeFailure,
    args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
    expected: {
      type: 'robotControls:HOME_FAILURE',
      payload: { robotName: 'robot-name', error: { message: 'AH' } },
      meta: { requestId: 'abc' },
    },
  },
  {
    name: 'robotControls:CLEAR_MOVEMENT_STATUS',
    creator: Actions.clearMovementStatus,
    args: ['robot-name'],
    expected: {
      type: 'robotControls:CLEAR_MOVEMENT_STATUS',
      payload: { robotName: 'robot-name' },
    },
  },
]

describe('robot controls actions', () => {
  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
