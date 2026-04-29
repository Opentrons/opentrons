import { describe, expect, it } from 'vitest'

import {
  INITIAL_ROBOT_AUTH_STATE,
  logInOrRefresh,
  logOutOrTimeOut,
  robotAuthReducer,
} from '../slice'

import type { RobotAuthState } from '../slice'

describe('robotAuthReducer', () => {
  it('uses empty object as initial state', () => {
    expect(
      robotAuthReducer(undefined, { type: 'not-handled' } as any)
    ).toStrictEqual({})
  })

  it('handles logins and login refreshes', () => {
    let state: RobotAuthState = INITIAL_ROBOT_AUTH_STATE

    // Log in to first robot:
    state = robotAuthReducer(
      INITIAL_ROBOT_AUTH_STATE,
      logInOrRefresh({
        robotName: 'testRobotNameA',
        username: 'testUserA',
        accessToken: 'testAccessTokenA',
        refreshToken: 'testRefreshTokenA',
        expiresAt: 1234,
      })
    )
    expect(state).toStrictEqual({
      testRobotNameA: {
        username: 'testUserA',
        accessToken: 'testAccessTokenA',
        refreshToken: 'testRefreshTokenA',
        expiresAt: 1234,
      },
    })

    // Log in to second robot:
    state = robotAuthReducer(
      state,
      logInOrRefresh({
        robotName: 'testRobotNameB',
        username: 'testUserB',
        accessToken: 'testAccessTokenB',
        refreshToken: null,
        expiresAt: 5678,
      })
    )
    expect(state).toStrictEqual({
      testRobotNameA: {
        username: 'testUserA',
        accessToken: 'testAccessTokenA',
        refreshToken: 'testRefreshTokenA',
        expiresAt: 1234,
      },
      testRobotNameB: {
        username: 'testUserB',
        accessToken: 'testAccessTokenB',
        refreshToken: null,
        expiresAt: 5678,
      },
    })

    // Refresh login for first robot:
    state = robotAuthReducer(
      state,
      logInOrRefresh({
        robotName: 'testRobotNameA',
        username: 'testUserARefreshed',
        accessToken: 'testAccessTokenARefreshed',
        refreshToken: 'testRefreshTokenARefreshed',
        expiresAt: 4321,
      })
    )
    expect(state).toStrictEqual({
      testRobotNameA: {
        username: 'testUserARefreshed',
        accessToken: 'testAccessTokenARefreshed',
        refreshToken: 'testRefreshTokenARefreshed',
        expiresAt: 4321,
      },
      testRobotNameB: {
        username: 'testUserB',
        accessToken: 'testAccessTokenB',
        refreshToken: null,
        expiresAt: 5678,
      },
    })
  })

  it('handles logouts', () => {
    const initialState: RobotAuthState = {
      testRobotNameA: {
        username: 'testUserA',
        accessToken: 'testAccessTokenA',
        refreshToken: 'testRefreshTokenA',
        expiresAt: 1234,
      },
      testRobotNameB: {
        username: 'testUserB',
        accessToken: 'testAccessTokenB',
        refreshToken: 'testRefreshTokenB',
        expiresAt: 5678,
      },
    }

    const newState = robotAuthReducer(
      initialState,
      logOutOrTimeOut({
        robotName: 'testRobotNameB',
      })
    )
    expect(newState).toStrictEqual({
      testRobotNameA: initialState.testRobotNameA,
    })
  })
})
