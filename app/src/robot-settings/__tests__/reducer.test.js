// @flow

import { robotSettingsReducer } from '../reducer'
import * as Fixtures from '../__fixtures__'

import type { Action } from '../../types'
import type { RobotSettingsState } from '../types'

type ReducerSpec = {|
  name: string,
  action: Action,
  state: RobotSettingsState,
  expected: RobotSettingsState,
|}

describe('robotSettingsReducer', () => {
  const SPECS: Array<ReducerSpec> = [
    {
      name: 'handles FETCH_SETTINGS_SUCCESS without restart required',
      action: {
        type: 'robotSettings:FETCH_SETTINGS_SUCCESS',
        meta: {},
        payload: {
          robotName: 'robotName',
          settings: Fixtures.mockRobotSettings,
          restartPath: null,
        },
      },
      state: {},
      expected: {
        robotName: {
          settings: Fixtures.mockRobotSettings,
          restartPath: null,
        },
      },
    },
    {
      name: 'handles FETCH_SETTINGS_SUCCESS with restart required',
      action: {
        type: 'robotSettings:FETCH_SETTINGS_SUCCESS',
        meta: {},
        payload: {
          robotName: 'robotName',
          settings: Fixtures.mockRobotSettings.slice(0, 1),
          restartPath: '/server/restart',
        },
      },
      state: {
        robotName: {
          settings: Fixtures.mockRobotSettings,
          restartPath: null,
        },
      },
      expected: {
        robotName: {
          settings: Fixtures.mockRobotSettings.slice(0, 1),
          restartPath: '/server/restart',
        },
      },
    },
    {
      name: 'handles UPDATE_SETTING_SUCCESS',
      action: {
        type: 'robotSettings:UPDATE_SETTING_SUCCESS',
        meta: {},
        payload: {
          robotName: 'robotName',
          settings: Fixtures.mockRobotSettings,
          restartPath: '/server/restart',
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
          settings: Fixtures.mockRobotSettings,
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
