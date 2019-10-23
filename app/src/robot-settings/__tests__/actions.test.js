// @flow

import * as Actions from '../actions'

import type { RobotSettingsAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: RobotSettingsAction,
|}

describe('robot settings actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'robotSettings:FETCH_SETTINGS',
      creator: Actions.fetchSettings,
      args: [{ name: 'robotName', ip: 'localhost', port: 31950 }],
      expected: {
        type: 'robotSettings:FETCH_SETTINGS',
        payload: {
          host: { name: 'robotName', ip: 'localhost', port: 31950 },
          method: 'GET',
          path: '/settings',
        },
      },
    },
    {
      name: 'robotSettings:UPDATE_SETTING',
      creator: Actions.updateSetting,
      args: [{ name: 'robotName', ip: 'localhost', port: 31950 }, 'foo', true],
      expected: {
        type: 'robotSettings:UPDATE_SETTING',
        meta: { settingId: 'foo' },
        payload: {
          host: { name: 'robotName', ip: 'localhost', port: 31950 },
          method: 'POST',
          path: '/settings',
          body: { id: 'foo', value: true },
        },
      },
    },
    {
      name: 'robotSettings:CLEAR_RESTART_REQUIRED',
      creator: Actions.clearRestartRequired,
      args: ['robotName'],
      expected: {
        type: 'robotSettings:CLEAR_RESTART_REQUIRED',
        payload: { robotName: 'robotName' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
