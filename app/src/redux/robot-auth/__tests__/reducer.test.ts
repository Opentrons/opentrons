import { describe, expect, it } from 'vitest'

import {
  INITIAL_ROBOT_AUTH_STATE,
  logIn,
  logOut,
  refreshLogin,
  robotAuthReducer,
} from '../slice'

import type { RobotAuthState } from '../slice'

describe('robotAuthReducer', () => {
  it('uses empty object as initial state', () => {
    expect(
      robotAuthReducer(undefined, { type: 'not-handled' } as any)
    ).toStrictEqual({
      perRobotAuthStates: {},
      mostRecentRobotName: null,
    } satisfies RobotAuthState)
  })

  it('handles logins and login refreshes', () => {
    let state: RobotAuthState = INITIAL_ROBOT_AUTH_STATE

    // Log in to first robot:
    state = robotAuthReducer(
      INITIAL_ROBOT_AUTH_STATE,
      logIn({
        robotName: 'testRobotNameA',
        username: 'testUserA',
        fullName: 'Test User A',
        accountType: 'user',
        accessToken: 'testAccessTokenA',
        refreshToken: 'testRefreshTokenA',
        expiresAt: 1234,
      })
    )
    expect(state).toStrictEqual({
      perRobotAuthStates: {
        testRobotNameA: {
          username: 'testUserA',
          fullName: 'Test User A',
          accountType: 'user',
          accessToken: 'testAccessTokenA',
          refreshToken: 'testRefreshTokenA',
          expiresAt: 1234,
        },
      },
      mostRecentRobotName: 'testRobotNameA',
    } satisfies typeof state)

    // Log in to second robot:
    state = robotAuthReducer(
      state,
      logIn({
        robotName: 'testRobotNameB',
        username: 'testUserB',
        fullName: 'Test User B',
        accountType: 'user',
        accessToken: 'testAccessTokenB',
        refreshToken: null,
        expiresAt: 5678,
      })
    )
    expect(state).toStrictEqual({
      perRobotAuthStates: {
        testRobotNameA: {
          username: 'testUserA',
          fullName: 'Test User A',
          accountType: 'user',
          accessToken: 'testAccessTokenA',
          refreshToken: 'testRefreshTokenA',
          expiresAt: 1234,
        },
        testRobotNameB: {
          username: 'testUserB',
          fullName: 'Test User B',
          accountType: 'user',
          accessToken: 'testAccessTokenB',
          refreshToken: null,
          expiresAt: 5678,
        },
      },
      mostRecentRobotName: 'testRobotNameB',
    } satisfies typeof state)

    // Refresh login for first robot:
    state = robotAuthReducer(
      state,
      refreshLogin({
        robotName: 'testRobotNameA',
        username: 'testUserARefreshed',
        fullName: 'Test User A',
        accountType: 'user',
        accessToken: 'testAccessTokenARefreshed',
        refreshToken: 'testRefreshTokenARefreshed',
        expiresAt: 4321,
      })
    )
    expect(state).toStrictEqual({
      perRobotAuthStates: {
        testRobotNameA: {
          username: 'testUserARefreshed',
          fullName: 'Test User A',
          accountType: 'user',
          accessToken: 'testAccessTokenARefreshed',
          refreshToken: 'testRefreshTokenARefreshed',
          expiresAt: 4321,
        },
        testRobotNameB: {
          username: 'testUserB',
          fullName: 'Test User B',
          accountType: 'user',
          accessToken: 'testAccessTokenB',
          refreshToken: null,
          expiresAt: 5678,
        },
      },
      mostRecentRobotName: 'testRobotNameA',
    } satisfies typeof state)
  })

  it('handles logouts', () => {
    const initialState: RobotAuthState = {
      perRobotAuthStates: {
        testRobotNameA: {
          username: 'testUserA',
          fullName: 'Test User A',
          accountType: 'user',
          accessToken: 'testAccessTokenA',
          refreshToken: 'testRefreshTokenA',
          expiresAt: 1234,
        },
        testRobotNameB: {
          username: 'testUserB',
          fullName: 'Test User B',
          accountType: 'user',
          accessToken: 'testAccessTokenB',
          refreshToken: 'testRefreshTokenB',
          expiresAt: 5678,
        },
      },
      mostRecentRobotName: 'testRobotNameB',
    }

    const newState = robotAuthReducer(
      initialState,
      logOut({
        robotName: 'testRobotNameB',
      })
    )
    expect(newState).toStrictEqual({
      perRobotAuthStates: {
        testRobotNameA: initialState.perRobotAuthStates.testRobotNameA,
      },
      mostRecentRobotName: 'testRobotNameB',
    } satisfies typeof newState)
  })
})
