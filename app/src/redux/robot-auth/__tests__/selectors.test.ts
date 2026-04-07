import { describe, expect, it } from 'vitest'

import { getAuthStateForRobot } from '../slice'

import type { State } from '../../types'

describe('robot auth selectors', () => {
  const stateWithRobotA = {
    robotAuth: {
      robotA: {
        username: 'alice',
        accessToken: 'token-a',
        refreshToken: null,
        expiresAt: 1234,
      },
    },
  } as unknown as State

  const emptyRobotAuthState = { robotAuth: {} } as unknown as State

  describe('getAuthStateForRobot', () => {
    it('returns null when robot is not in state', () => {
      expect(getAuthStateForRobot(emptyRobotAuthState, 'robotA')).toEqual(null)
    })

    it('returns per-robot auth when present', () => {
      expect(getAuthStateForRobot(stateWithRobotA, 'robotA')).toEqual({
        username: 'alice',
        accessToken: 'token-a',
        refreshToken: null,
        expiresAt: 1234,
      })
    })
  })
})
