// @flow

import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'

import type { ModulesAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: ModulesAction,
|}

describe('robot modules actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'modules:FETCH_MODULES',
      creator: Actions.fetchModules,
      args: ['robot-name'],
      expected: {
        type: 'modules:FETCH_MODULES',
        payload: { robotName: 'robot-name' },
        meta: {},
      },
    },
    {
      name: 'modules:FETCH_MODULES_SUCCESS',
      creator: Actions.fetchModulesSuccess,
      args: [
        'robot-name',
        Fixtures.mockFetchModulesSuccessActionPayloadModules,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'modules:FETCH_MODULES_SUCCESS',
        payload: {
          robotName: 'robot-name',
          modules: Fixtures.mockFetchModulesSuccessActionPayloadModules,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'modules:FETCH_MODULES_FAILURE',
      creator: Actions.fetchModulesFailure,
      args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'modules:FETCH_MODULES_FAILURE',
        payload: {
          robotName: 'robot-name',
          error: { message: 'AH' },
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'modules:SEND_MODULE_COMMAND',
      creator: Actions.sendModuleCommand,
      args: ['robot-name', 'abc123', 'set_temperature', [1, 2, 3]],
      expected: {
        type: 'modules:SEND_MODULE_COMMAND',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
          command: 'set_temperature',
          args: [1, 2, 3],
        },
        meta: {},
      },
    },
    {
      name: 'modules:SEND_MODULE_COMMAND_SUCCESS',
      creator: Actions.sendModuleCommandSuccess,
      args: [
        'robot-name',
        'abc123',
        'set_temperature',
        Fixtures.mockSendModuleCommandSuccess.body.returnValue,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'modules:SEND_MODULE_COMMAND_SUCCESS',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
          command: 'set_temperature',
          returnValue: Fixtures.mockSendModuleCommandSuccess.body.returnValue,
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'modules:SEND_MODULE_COMMAND_FAILURE',
      creator: Actions.sendModuleCommandFailure,
      args: [
        'robot-name',
        'abc123',
        'set_temperature',
        { message: 'AH' },
        { requestId: 'abc' },
      ],
      expected: {
        type: 'modules:SEND_MODULE_COMMAND_FAILURE',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
          command: 'set_temperature',
          error: { message: 'AH' },
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'modules:UPDATE_MODULE',
      creator: Actions.updateModule,
      args: ['robot-name', 'abc123'],
      expected: {
        type: 'modules:UPDATE_MODULE',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
        },
        meta: {},
      },
    },
    {
      name: 'modules:UPDATE_MODULE_SUCCESS',
      creator: Actions.updateModuleSuccess,
      args: ['robot-name', 'abc123', 'update complete', { requestId: 'abc' }],
      expected: {
        type: 'modules:UPDATE_MODULE_SUCCESS',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
          message: 'update complete',
        },
        meta: { requestId: 'abc' },
      },
    },
    {
      name: 'modules:UPDATE_MODULE_FAILURE',
      creator: Actions.updateModuleFailure,
      args: ['robot-name', 'abc123', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'modules:UPDATE_MODULE_FAILURE',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
          error: { message: 'AH' },
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
