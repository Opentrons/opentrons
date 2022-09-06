import * as Actions from '../actions'

import type { ModulesAction } from '../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args: unknown[]
  expected: ModulesAction
}

describe('robot modules actions', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'modules:UPDATE_MODULE',
      creator: Actions.updateModule,
      args: ['robot-name', 'abc123'],
      expected: {
        type: 'modules:UPDATE_MODULE',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
        },
        meta: {} as any,
      },
    },
    {
      name: 'modules:UPDATE_MODULE_SUCCESS',
      creator: Actions.updateModuleSuccess,
      args: ['robot-name', 'abc123', 'update complete', { requestId: 'abc' }],
      expected: {
        type: 'modules:UPDATE_MODULE_SUCCESS',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
          message: 'update complete',
        },
        meta: { requestId: 'abc' } as any,
      },
    },
    {
      name: 'modules:UPDATE_MODULE_FAILURE',
      creator: Actions.updateModuleFailure,
      args: ['robot-name', 'abc123', { message: 'AH' }, { requestId: 'abc' }],
      expected: {
        type: 'modules:UPDATE_MODULE_FAILURE',
        payload: {
          robotName: 'robot-name',
          moduleId: 'abc123',
          error: { message: 'AH' },
        },
        meta: { requestId: 'abc' } as any,
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => expect(creator(...args)).toEqual(expected))
  })
})
