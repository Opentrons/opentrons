import { describe, expect, it } from 'vitest'

import {
  getAuthStateForRobot,
  getIsLoggedInToLocalRobot,
  getLocalRobotAuthState,
} from '../slice'

import type {
  DiscoveryClientRobot,
  DiscoveryClientRobotAddress,
} from '@opentrons/discovery-client'
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

  describe('local robot selectors', () => {
    const localRobot: DiscoveryClientRobot = {
      addresses: [
        {
          ip: 'localhost',
        } satisfies Partial<DiscoveryClientRobotAddress> as DiscoveryClientRobotAddress,
      ],
      health: {} as any,
      name: 'testRobot',
      serverHealth: {} as any,
    }
    const authState = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: 1234,
      username: 'george_clooney',
    }

    it('returns data when the local robot has auth state', () => {
      const state = {
        discovery: {
          scanning: false,
          robotsByName: {
            [localRobot.name]: localRobot,
          },
        },
        robotAuth: {
          [localRobot.name]: authState,
        },
      } satisfies Partial<State> as State

      expect(getLocalRobotAuthState(state)).toStrictEqual(
        state.robotAuth[localRobot.name]
      )
      expect(getIsLoggedInToLocalRobot(state)).toStrictEqual(true)
    })

    it('returns null when there is no local robot', () => {
      const state = {
        discovery: {
          scanning: false,
          robotsByName: {},
        },
        robotAuth: {
          [localRobot.name]: authState,
        },
      } satisfies Partial<State> as State

      expect(getLocalRobotAuthState(state)).toStrictEqual(null)
      expect(getIsLoggedInToLocalRobot(state)).toStrictEqual(false)
    })
    it('returns null when the local robot has no auth state', () => {
      const state = {
        discovery: {
          scanning: false,
          robotsByName: {
            [localRobot.name]: localRobot,
          },
        },
        robotAuth: {},
      } satisfies Partial<State> as State

      expect(getLocalRobotAuthState(state)).toStrictEqual(null)
      expect(getIsLoggedInToLocalRobot(state)).toStrictEqual(false)
    })
  })
})
