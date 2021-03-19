// @flow
import * as Actions from '../actions'
import type { RobotApiAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args: Array<mixed>,
  expected: RobotApiAction,
|}

describe('robot admin actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'robotApi:DISMISS_REQUEST',
      creator: Actions.dismissRequest,
      args: ['requestId'],
      expected: {
        type: 'robotApi:DISMISS_REQUEST',
        payload: { requestId: 'requestId' },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
