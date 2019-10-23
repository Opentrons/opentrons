// @flow

import { robotSettingsReducer } from '../reducer'

import type { Action, ActionLike } from '../../types'
import type { RobotSettingsState } from '../types'

type ReducerSpec = {|
  name: string,
  action: Action | ActionLike,
  state: RobotSettingsState,
  expected: RobotSettingsState,
|}

describe('robotSettingsReducer', () => {
  const SPECS: Array<ReducerSpec> = [
    {
      name: 'handles initial robotApi:RESPONSE for GET /settings',
      action: {
        type: 'robotApi:RESPONSE__GET__/settings',
        meta: {},
        payload: {
          host: { name: 'robotName' },
          method: 'GET',
          path: '/settings',
          body: {
            settings: [
              { id: 'foo', title: 'Foo', description: 'foobar', value: true },
              { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
            ],
          },
        },
      },
      state: {},
      expected: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
          ],
          restartRequired: false,
        },
      },
    },
    {
      name: 'handles subsequent robotApi:RESPONSE for GET /settings',
      action: {
        type: 'robotApi:RESPONSE__GET__/settings',
        meta: {},
        payload: {
          host: { name: 'robotName' },
          method: 'GET',
          path: '/settings',
          body: {
            settings: [
              { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            ],
          },
        },
      },
      state: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
          ],
          restartRequired: true,
        },
      },
      expected: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
          ],
          restartRequired: true,
        },
      },
    },
    {
      name: 'handles robotApi:RESPONSE for POST /settings',
      action: {
        type: 'robotApi:RESPONSE__POST__/settings',
        meta: {},
        payload: {
          host: { name: 'robotName' },
          method: 'POST',
          path: '/settings',
          body: {
            settings: [
              { id: 'foo', title: 'Foo', description: 'foobar', value: true },
              { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
            ],
          },
        },
      },
      state: {
        robotName: {
          settings: [],
          restartRequired: false,
        },
      },
      expected: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
          ],
          restartRequired: false,
        },
      },
    },
    {
      name: 'handles robotApi:RESPONSE for POST /settings',
      action: {
        type: 'robotApi:RESPONSE__POST__/settings',
        meta: { settingId: 'bar' },
        payload: {
          host: { name: 'robotName' },
          method: 'POST',
          path: '/settings',
          body: {
            settings: [
              { id: 'foo', title: 'Foo', description: 'foobar', value: true },
              { id: 'bar', title: 'Bar', description: 'bazqux', value: true },
            ],
          },
        },
      },
      state: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
          ],
          restartRequired: false,
        },
      },
      expected: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            { id: 'bar', title: 'Bar', description: 'bazqux', value: true },
          ],
          restartRequired: false,
        },
      },
    },
    {
      name:
        'handles robotApi:RESPONSE for POST /settings where restart is required',
      action: {
        type: 'robotApi:RESPONSE__POST__/settings',
        meta: { settingId: 'baz' },
        payload: {
          host: { name: 'robotName' },
          method: 'POST',
          path: '/settings',
          body: {
            settings: [
              {
                id: 'baz',
                title: 'Baz',
                description: 'bazqux',
                value: true,
                restart_required: true,
              },
            ],
          },
        },
      },
      state: {
        robotName: {
          settings: [
            {
              id: 'baz',
              title: 'Baz',
              description: 'bazqux',
              value: false,
              restart_required: true,
            },
          ],
          restartRequired: false,
        },
      },
      expected: {
        robotName: {
          settings: [
            {
              id: 'baz',
              title: 'Baz',
              description: 'bazqux',
              value: true,
              restart_required: true,
            },
          ],
          restartRequired: true,
        },
      },
    },
    {
      name: 'handles CLEAR_RESTART_REQUIRED',
      action: {
        type: 'robotSettings:CLEAR_RESTART_REQUIRED',
        payload: { robotName: 'robotName' },
      },
      state: { robotName: { settings: [], restartRequired: true } },
      expected: { robotName: { settings: [], restartRequired: false } },
    },
    {
      name: 'handles robotAdmin:RESTART',
      action: {
        type: 'robotAdmin:RESTART',
        meta: { robot: true },
        payload: { host: { name: 'robotName', ip: 'localhost', port: 31950 } },
      },
      state: { robotName: { settings: [], restartRequired: true } },
      expected: { robotName: { settings: [], restartRequired: false } },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, state, expected } = spec

    test(name, () => {
      expect(robotSettingsReducer(state, action)).toEqual(expected)
    })
  })
})
