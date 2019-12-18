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
]

describe('robot controls actions', () => {
  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
