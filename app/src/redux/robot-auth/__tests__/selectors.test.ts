import { describe, expect, it } from 'vitest'

import {
  getAuthStateForRobot,
  getIsLoggedInToLocalRobot,
  getLocalRobotAuthState,
  getMostRecentRobotName,
} from '../slice'

import type {
  DiscoveryClientRobot,
  DiscoveryClientRobotAddress,
} from '@opentrons/discovery-client'
import type { State } from '../../types'
import type { RobotAuthState } from '../slice'

function makeTestState(robotAuth: RobotAuthState): State {
  return {
    robotAuth,
  } satisfies Partial<State> as State
}

describe('robot auth selectors', () => {
  const stateWithRobotA = makeTestState({
    perRobotAuthStates: {
      robotA: {
        username: 'alice',
        accessToken: 'token-a',
        refreshToken: null,
        expiresAt: 1234,
      },
    },
    mostRecentRobotName: 'robotA',
  })

  const emptyRobotAuthState = makeTestState({
    perRobotAuthStates: {},
    mostRecentRobotName: null,
  })

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
      serverHealth: { robotModel: 'OT-3 Standard' } as any,
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
          perRobotAuthStates: { [localRobot.name]: authState },
          mostRecentRobotName: null,
        },
      } satisfies Partial<State> as State

      expect(getLocalRobotAuthState(state)).toStrictEqual(
        state.robotAuth.perRobotAuthStates[localRobot.name]
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
          perRobotAuthStates: { [localRobot.name]: authState },
          mostRecentRobotName: null,
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
        robotAuth: { perRobotAuthStates: {}, mostRecentRobotName: null },
      } satisfies Partial<State> as State

      expect(getLocalRobotAuthState(state)).toStrictEqual(null)
      expect(getIsLoggedInToLocalRobot(state)).toStrictEqual(false)
    })
  })

  describe('getMostRecentRobotName', () => {
    it('returns the most recent robot name', () => {
      expect(
        getMostRecentRobotName(
          makeTestState({
            perRobotAuthStates: {},
            mostRecentRobotName: null,
          })
        )
      ).toStrictEqual(null)
      expect(
        getMostRecentRobotName(
          makeTestState({
            perRobotAuthStates: {},
            mostRecentRobotName: 'Otie',
          })
        )
      ).toStrictEqual('Otie')
    })
  })
})
