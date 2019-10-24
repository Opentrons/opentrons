// @flow

import * as Actions from '../actions'

import type { RobotSettingsAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: RobotSettingsAction,
|}

const mockRobot = { name: 'robotName', ip: 'localhost', port: 31950 }

describe('robot settings actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'robotSettings:FETCH_SETTINGS',
      creator: Actions.fetchSettings,
      args: [mockRobot],
      expected: {
        type: 'robotSettings:FETCH_SETTINGS',
        payload: { host: mockRobot, method: 'GET', path: '/settings' },
      },
    },
    {
      name: 'robotSettings:UPDATE_SETTING',
      creator: Actions.updateSetting,
      args: [mockRobot, 'foo', true],
      expected: {
        type: 'robotSettings:UPDATE_SETTING',
        payload: {
          host: mockRobot,
          method: 'POST',
          path: '/settings',
          body: { id: 'foo', value: true },
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
