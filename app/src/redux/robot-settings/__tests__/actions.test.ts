import * as Actions from '../actions'
import * as Fixtures from '../__fixtures__'
import type { RobotSettingsAction } from '../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args: unknown[]
  expected: RobotSettingsAction
}

describe('robot settings actions', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'robotSettings:FETCH_SETTINGS',
      creator: Actions.fetchSettings,
      args: ['robot-name'],
      expected: {
        type: 'robotSettings:FETCH_SETTINGS',
        payload: { robotName: 'robot-name' },
        meta: {} as any,
      },
    },
    {
      name: 'robotSettings:FETCH_SETTINGS_SUCCESS',
      creator: Actions.fetchSettingsSuccess,
      args: [
        'robot-name',
        Fixtures.mockRobotSettings,
        null,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'robotSettings:FETCH_SETTINGS_SUCCESS',
        payload: {
          robotName: 'robot-name',
          settings: Fixtures.mockRobotSettings,
          restartPath: null,
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'robotSettings:FETCH_SETTINGS_FAILURE',
      creator: Actions.fetchSettingsFailure,
      args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'robotSettings:FETCH_SETTINGS_FAILURE',
        payload: { robotName: 'robot-name', error: { message: 'AH' } },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'robotSettings:UPDATE_SETTING',
      creator: Actions.updateSetting,
      args: ['robot-name', 'foo', true],
      expected: {
        type: 'robotSettings:UPDATE_SETTING',
        payload: {
          robotName: 'robot-name',
          settingId: 'foo',
          value: true,
        },
        meta: {} as any,
      },
    },
    {
      name: 'robotSettings:UPDATE_SETTING_SUCCESS',
      creator: Actions.updateSettingSuccess,
      args: [
        'robot-name',
        Fixtures.mockRobotSettings,
        null,
        { requestId: 'abc' },
      ],
      expected: {
        type: 'robotSettings:UPDATE_SETTING_SUCCESS',
        payload: {
          robotName: 'robot-name',
          settings: Fixtures.mockRobotSettings,
          restartPath: null,
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'robotSettings:UPDATE_SETTING_FAILURE',
      creator: Actions.updateSettingFailure,
      args: ['robot-name', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'robotSettings:UPDATE_SETTING_FAILURE',
        payload: { robotName: 'robot-name', error: { message: 'AH' } },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'clearRestartPath',
      creator: Actions.clearRestartPath,
      args: ['robot-name'],
      expected: {
        type: 'robotSettings:CLEAR_RESTART_PATH',
        payload: { robotName: 'robot-name' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
