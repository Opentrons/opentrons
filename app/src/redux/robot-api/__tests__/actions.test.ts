import * as Actions from '../actions'
import type { RobotApiAction } from '../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args: unknown[]
  expected: RobotApiAction
}

describe('robot admin actions', () => {
  const SPECS: ActionSpec[] = [
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
