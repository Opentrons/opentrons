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
      args: [{ name: 'robotName', ip: 'localhost', port: 31950 }],
      expected: {
        type: 'robotAdmin:RESTART',
        meta: { robot: true },
        payload: {
          host: { name: 'robotName', ip: 'localhost', port: 31950 },
          method: 'POST',
          path: '/server/restart',
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
