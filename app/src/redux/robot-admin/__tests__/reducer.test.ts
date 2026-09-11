import { describe, expect, it } from 'vitest'

import { robotAdminReducer } from '../reducer'

import type { Action } from '../../types'
import type { PerRobotAdminState } from '../types'

type PartialState = Partial<{
  [robotName: string]: undefined | Partial<PerRobotAdminState>
}>

describe('robotAdminReducer', () => {
  it('should handle robotAdmin:RESTART_STATUS_CHANGED with boot ID', () => {
    const state: PartialState = {}
    const action: Action = {
      type: 'robotAdmin:RESTART_STATUS_CHANGED',
      payload: {
        robotName: 'robotName',
        restartStatus: 'restart-pending',
        bootId: 'abc123',
        startTime: new Date('2000-01-01'),
      },
    }

    const result = robotAdminReducer(state, action)

    expect(result).toEqual({
      robotName: {
        restart: {
          status: 'restart-pending',
          bootId: 'abc123',
          startTime: new Date('2000-01-01'),
        },
      },
    })
  })

  it('should handle robotAdmin:RESTART_STATUS_CHANGED without boot ID', () => {
    const state: PartialState = {
      robotName: {
        restart: {
          status: 'restart-pending',
          bootId: 'abc123',
          startTime: new Date('2000-01-01'),
        },
      },
    }
    const action: Action = {
      type: 'robotAdmin:RESTART_STATUS_CHANGED',
      payload: {
        robotName: 'robotName',
        restartStatus: 'restart-in-progress',
        bootId: null,
        startTime: null,
      },
    }

    const result = robotAdminReducer(state, action)

    expect(result).toEqual({
      robotName: {
        restart: {
          status: 'restart-in-progress',
          bootId: 'abc123',
          startTime: new Date('2000-01-01'),
        },
      },
    })
  })
})
