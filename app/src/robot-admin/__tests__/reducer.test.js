// @flow

import { mockDiscoveryClientRobot } from '../../discovery/__fixtures__'
import { HEALTH_STATUS_NOT_OK } from '../../discovery'
import { robotAdminReducer } from '../reducer'

import type { Action } from '../../types'
import type { RobotAdminState } from '../types'

type ReducerSpec = {|
  name: string,
  action: Action,
  state: RobotAdminState,
  expected: RobotAdminState,
|}

describe('robotAdminReducer', () => {
  const SPECS: Array<ReducerSpec> = [
    {
      name: 'handles robotAdmin:RESTART',
      action: {
        type: 'robotAdmin:RESTART',
        meta: { robot: true },
        payload: { robotName: 'robotName' },
      },
      state: {},
      expected: { robotName: { status: 'restart-pending' } },
    },
    {
      name: 'handles failed robotAdmin:RESTART_FAILURE',
      action: {
        type: 'robotAdmin:RESTART_FAILURE',
        payload: { robotName: 'robotName', error: { message: 'AH' } },
        meta: {},
      },
      state: {},
      expected: { robotName: { status: 'restart-failed' } },
    },
    {
      name: 'discovery:UPDATE_LIST sets status to up if health status is ok',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [{ ...mockDiscoveryClientRobot, name: 'a' }],
        },
      },
      state: {
        a: { status: 'restarting' },
      },
      expected: { a: { status: 'up' } },
    },
    {
      name:
        'discovery:UPDATE_LIST leaves restart pending alone if health status is ok',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [{ ...mockDiscoveryClientRobot, name: 'a' }],
        },
      },
      state: {
        a: { status: 'restart-pending' },
      },
      expected: { a: { status: 'restart-pending' } },
    },
    {
      name:
        'discovery:UPDATE_LIST sets restarting if restart pending health status not ok',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            {
              ...mockDiscoveryClientRobot,
              name: 'a',
              addresses: [
                {
                  ...mockDiscoveryClientRobot.addresses[0],
                  healthStatus: HEALTH_STATUS_NOT_OK,
                },
              ],
            },
          ],
        },
      },
      state: {
        a: { status: 'restart-pending' },
      },
      expected: { a: { status: 'restarting' } },
    },
    {
      name:
        'discovery:UPDATE_LIST leaves restarting alone if restarting and ok: false',
      action: {
        type: 'discovery:UPDATE_LIST',
        payload: {
          robots: [
            {
              ...mockDiscoveryClientRobot,
              name: 'a',
              addresses: [
                {
                  ...mockDiscoveryClientRobot.addresses[0],
                  healthStatus: HEALTH_STATUS_NOT_OK,
                },
              ],
            },
          ],
        },
      },
      state: {
        a: { status: 'restarting' },
      },
      expected: { a: { status: 'restarting' } },
    },
    {
      name: 'handles robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS',
      action: {
        type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS',
        payload: {
          robotName: 'robotName',
          options: [
            { id: 'foo', name: 'Foo', description: 'foobar' },
            { id: 'baz', name: 'Baz', description: 'bazqux' },
          ],
        },
        meta: {},
      },
      state: {
        robotName: {
          resetConfigOptions: [],
        },
      },
      expected: {
        robotName: {
          resetConfigOptions: [
            { id: 'foo', name: 'Foo', description: 'foobar' },
            { id: 'baz', name: 'Baz', description: 'bazqux' },
          ],
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, state, expected } = spec

    it(name, () => {
      expect(robotAdminReducer(state, action)).toEqual(expected)
    })
  })
})
