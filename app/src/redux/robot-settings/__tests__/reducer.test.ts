import { describe, expect, it } from 'vitest'

import * as Fixtures from '../__fixtures__'
import { robotSettingsReducer } from '../reducer'

import type { Action } from '../../types'
import type { RobotSettingsState } from '../types'

interface ReducerSpec {
  name: string
  action: Action
  state: RobotSettingsState
  expected: RobotSettingsState
}

describe('robotSettingsReducer', () => {
  const SPECS: ReducerSpec[] = [
    {
      name: 'handles FETCH_SETTINGS_SUCCESS without restart required',
      action: {
        type: 'robotSettings:FETCH_SETTINGS_SUCCESS',
        meta: {} as any,
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
        },
      },
    },
    {
      name: 'handles FETCH_SETTINGS_SUCCESS with restart required',
      action: {
        type: 'robotSettings:FETCH_SETTINGS_SUCCESS',
        meta: {} as any,
        payload: {
          robotName: 'robotName',
          settings: Fixtures.mockRobotSettings.slice(0, 1),
          restartPath: '/server/restart',
        },
      },
      state: {
        robotName: {
          settings: Fixtures.mockRobotSettings,
        },
      },
      expected: {
        robotName: {
          settings: Fixtures.mockRobotSettings.slice(0, 1),
        },
      },
    },
    {
      name: 'handles UPDATE_SETTING_SUCCESS',
      action: {
        type: 'robotSettings:UPDATE_SETTING_SUCCESS',
        meta: {} as any,
        payload: {
          robotName: 'robotName',
          settings: Fixtures.mockRobotSettings,
          restartPath: '/server/restart',
        },
      },
      state: {
        robotName: {
          settings: [],
        },
      },
      expected: {
        robotName: {
          settings: Fixtures.mockRobotSettings,
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, action, state, expected } = spec

    it(name, () => {
      expect(robotSettingsReducer(state, action)).toEqual(expected)
    })
  })
})
