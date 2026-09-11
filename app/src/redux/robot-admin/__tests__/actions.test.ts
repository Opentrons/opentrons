import { describe, expect, it } from 'vitest'

import * as Actions from '../actions'

import type { RobotAdminAction } from '../types'

interface ActionSpec {
  name: string
  creator: (...args: any[]) => unknown
  args: unknown[]
  expected: RobotAdminAction
}

describe('robot admin actions', () => {
  const SPECS: ActionSpec[] = [
    {
      name: 'robotAdmin:RESTART_STATUS_CHANGED',
      creator: Actions.restartStatusChanged,
      args: ['robotName', 'restart-pending', 'abc123', new Date('2000-01-01')],
      expected: {
        type: 'robotAdmin:RESTART_STATUS_CHANGED',
        payload: {
          robotName: 'robotName',
          restartStatus: 'restart-pending',
          bootId: 'abc123',
          startTime: new Date('2000-01-01'),
        },
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, args, expected } = spec
    it(name, () => {
      expect(creator(...args)).toEqual(expected)
    })
  })
})
