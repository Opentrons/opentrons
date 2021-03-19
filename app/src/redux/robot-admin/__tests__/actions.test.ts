// @flow
import * as Actions from '../actions'
import type { RobotAdminAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: RobotAdminAction,
|}

describe('robot admin actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'robotAdmin:RESTART',
      creator: Actions.restartRobot,
      args: ['robotName'],
      expected: {
        type: 'robotAdmin:RESTART',
        payload: { robotName: 'robotName' },
        meta: { robot: true },
      },
    },
    {
      name: 'robotAdmin:RESTART_SUCCESS',
      creator: Actions.restartRobotSuccess,
      args: ['robotName', { requestId: 'foo' }],
      expected: {
        type: 'robotAdmin:RESTART_SUCCESS',
        payload: { robotName: 'robotName' },
        meta: { requestId: 'foo' },
      },
    },
    {
      name: 'robotAdmin:RESTART_FAILURE',
      creator: Actions.restartRobotFailure,
      args: ['robotName', { message: 'AH' }, { requestId: 'foo' }],
      expected: {
        type: 'robotAdmin:RESTART_FAILURE',
        payload: { robotName: 'robotName', error: { message: 'AH' } },
        meta: { requestId: 'foo' },
      },
    },
    {
      name: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS',
      creator: Actions.fetchResetConfigOptions,
      args: ['robotName'],
      expected: {
        type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS',
        payload: { robotName: 'robotName' },
        meta: {},
      },
    },
    {
      name: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS',
      creator: Actions.fetchResetConfigOptionsSuccess,
      args: [
        'robotName',
        [
          { id: 'foo', name: 'Foo', description: 'foobar' },
          { id: 'bar', name: 'Bar', description: 'bazqux' },
        ],
        { requestId: 'foo' },
      ],
      expected: {
        type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS',
        payload: {
          robotName: 'robotName',
          options: [
            { id: 'foo', name: 'Foo', description: 'foobar' },
            { id: 'bar', name: 'Bar', description: 'bazqux' },
          ],
        },
        meta: { requestId: 'foo' },
      },
    },
    {
      name: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_FAILURE',
      creator: Actions.fetchResetConfigOptionsFailure,
      args: ['robotName', { message: 'AH' }, { requestId: 'foo' }],
      expected: {
        type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_FAILURE',
        payload: { robotName: 'robotName', error: { message: 'AH' } },
        meta: { requestId: 'foo' },
      },
    },
    {
      name: 'robotAdmin:RESET_CONFIG',
      creator: Actions.resetConfig,
      args: ['robotName', { foo: true, bar: false }],
      expected: {
        type: 'robotAdmin:RESET_CONFIG',
        payload: { robotName: 'robotName', resets: { foo: true, bar: false } },
        meta: {},
      },
    },
    {
      name: 'robotAdmin:RESET_CONFIG_SUCCESS',
      creator: Actions.resetConfigSuccess,
      args: ['robotName', { requestId: 'foo' }],
      expected: {
        type: 'robotAdmin:RESET_CONFIG_SUCCESS',
        payload: { robotName: 'robotName' },
        meta: { requestId: 'foo' },
      },
    },
    {
      name: 'robotAdmin:RESET_CONFIG_FAILURE',
      creator: Actions.resetConfigFailure,
      args: ['robotName', { message: 'AH' }, { requestId: 'foo' }],
      expected: {
        type: 'robotAdmin:RESET_CONFIG_FAILURE',
        payload: { robotName: 'robotName', error: { message: 'AH' } },
        meta: { requestId: 'foo' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
