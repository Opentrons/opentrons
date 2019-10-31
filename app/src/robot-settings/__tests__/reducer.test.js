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
          restartPath: null,
        },
      },
    },
    {
      name: 'handles robotApi:RESPONSE for GET /settings with restart required',
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
            links: { restart: '/server/restart' },
          },
        },
      },
      state: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
          ],
          restartPath: null,
        },
      },
      expected: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
          ],
          restartPath: '/server/restart',
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
          restartPath: null,
        },
      },
      expected: {
        robotName: {
          settings: [
            { id: 'foo', title: 'Foo', description: 'foobar', value: true },
            { id: 'bar', title: 'Bar', description: 'bazqux', value: false },
          ],
          restartPath: null,
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
            links: { restart: '/server/restart' },
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
          restartPath: null,
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
          restartPath: '/server/restart',
        },
      },
    },
    {
      name: 'handles robotSettings:CLEAR_RESTART_PATH',
      action: {
        type: 'robotSettings:CLEAR_RESTART_PATH',
        payload: { robotName: 'robotName' },
      },
      state: { robotName: { settings: [], restartPath: '/restart' } },
      expected: { robotName: { settings: [], restartPath: null } },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, state, expected } = spec

    test(name, () => {
      expect(robotSettingsReducer(state, action)).toEqual(expected)
    })
  })
})
