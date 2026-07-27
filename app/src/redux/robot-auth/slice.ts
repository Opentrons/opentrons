/** The Redux slice for authorization and authentication. */

import { createSelector, createSlice } from '@reduxjs/toolkit'
import isEqual from 'lodash/isEqual'

import { type ActionTypesFromSlice } from '../ActionTypesFromSlice'
import { getLocalRobot } from '../discovery'

import type { Draft, PayloadAction } from '@reduxjs/toolkit'
import type { AuthUserAccountType } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

export interface RobotAuthState {
  perRobotAuthStates: {
    [robotName: string]: PerRobotAuthState | undefined
  }

  /** The robotName of the robot that's most recently been logged into. */
  mostRecentRobotName: string | null
}

export interface LoggedInUserProfile {
  /** The username that we're currently logged in as. */
  username: string

  /** The user's legal name returned from GET /auth/users/self at login. */
  fullName: string

  /** The account type returned from GET /auth/users/self at login. */
  accountType: AuthUserAccountType
}

export interface PerRobotAuthState {
  /** Profile data returned from GET /auth/users/self at login. */
  user: LoggedInUserProfile

  /** The OAuth 2 access token, for making robot API requests. */
  accessToken: string

  /**
   * The OAuth 2 refresh token, if the server issued one,
   * for refreshing the access token.
   */
  refreshToken: string | null

  /**
   * When the access token expires, as milliseconds since epoch,
   * if the server supplied this information.
   */
  expiresAt: number | null
}

export const INITIAL_ROBOT_AUTH_STATE: RobotAuthState = {
  perRobotAuthStates: {},
  mostRecentRobotName: null,
}

/** Stores the result of logging in to a robot, of refreshing an existing login. */
interface LogInOrRefreshPayload {
  robotName: string
  user: LoggedInUserProfile
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
}

interface UpdateLoggedInUserProfilePayload {
  robotName: string
  username: string
  fullName: string
}

/** Stores the result of logging out of a robot, or of a login naturally timing out. */
interface LogOutOrTimeOutPayload {
  robotName: string
}

const robotAuthSlice = createSlice({
  name: 'robotAuth',
  initialState: INITIAL_ROBOT_AUTH_STATE,
  reducers: {
    logIn: (stateDraft, action: PayloadAction<LogInOrRefreshPayload>) => {
      logInOrRefresh(stateDraft, action.payload)
    },
    refreshLogin: (
      stateDraft,
      action: PayloadAction<LogInOrRefreshPayload>
    ) => {
      logInOrRefresh(stateDraft, action.payload)
    },
    logOut: (stateDraft, action: PayloadAction<LogOutOrTimeOutPayload>) => {
      logOutOrTimeOut(stateDraft, action.payload)
    },
    timeOutLogin: (
      stateDraft,
      action: PayloadAction<LogOutOrTimeOutPayload>
    ) => {
      logOutOrTimeOut(stateDraft, action.payload)
    },
    updateLoggedInUserProfile: (
      stateDraft,
      action: PayloadAction<UpdateLoggedInUserProfilePayload>
    ) => {
      const { robotName, username, fullName } = action.payload
      const authState = stateDraft.perRobotAuthStates[robotName]!
      authState.user.username = username
      authState.user.fullName = fullName
    },
  },
})

function logInOrRefresh(
  stateDraft: Draft<RobotAuthState>,
  payload: LogInOrRefreshPayload
): void {
  const { robotName, user, accessToken, refreshToken, expiresAt } = payload
  stateDraft.perRobotAuthStates[robotName] = {
    user,
    accessToken,
    refreshToken,
    expiresAt,
  }
  stateDraft.mostRecentRobotName = robotName
}

function logOutOrTimeOut(
  stateDraft: Draft<RobotAuthState>,
  payload: LogOutOrTimeOutPayload
): void {
  // dynamic-delete is normal and fine with Immer and Redux.
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete stateDraft.perRobotAuthStates[payload.robotName]
}

export const robotAuthReducer = robotAuthSlice.reducer

export const {
  logIn,
  refreshLogin,
  logOut,
  timeOutLogin,
  updateLoggedInUserProfile,
} = robotAuthSlice.actions

export type RobotAuthAction = ActionTypesFromSlice<
  typeof robotAuthSlice.actions
>

export function getAuthStateForRobot(
  state: State,
  robotName: string
): PerRobotAuthState | null {
  return state.robotAuth?.perRobotAuthStates[robotName] ?? null
}

export function getUsernameForRobot(
  state: State,
  robotName: string | null
): string | null {
  if (robotName == null) {
    return null
  }
  return getAuthStateForRobot(state, robotName)?.user.username ?? null
}

export function getLoggedInUserForRobot(
  state: State,
  robotName: string
): LoggedInUserProfile | null {
  return getAuthStateForRobot(state, robotName)?.user ?? null
}

export function getIsAdminForRobot(state: State, robotName: string): boolean {
  return getAuthStateForRobot(state, robotName)?.user.accountType === 'admin'
}

/**
 * On the on-device display, this returns info for the current login, if the user
 * is currently logged in. This should not be used in the desktop app.
 *
 * This only considers client-side state. Robot-side state, like whether access control
 * is enabled at all, needs to be fetched separately.
 */
export const getLocalRobotAuthState = createSelector(
  (state: State) => state,
  (state: State) => getLocalRobot(state)?.name ?? null,
  (state: State, localRobotName: string | null): PerRobotAuthState | null => {
    if (localRobotName == null) {
      return null
    } else {
      return getAuthStateForRobot(state, localRobotName)
    }
  }
)

export const getMostRecentRobotName = createSelector(
  (state: State) => state,
  (state: State): string | null => state.robotAuth.mostRecentRobotName
)

export const getLocalRobotAccessToken = createSelector(
  getLocalRobotAuthState,
  (localRobotAuthState: PerRobotAuthState | null): string | null => {
    return localRobotAuthState?.accessToken ?? null
  }
)

/**
 * On the on-device display, this returns whether we're currently logged in to the
 * local robot. This should not be used in the desktop app.
 *
 * This only considers client-side state. Robot-side state, like whether access control
 * is enabled at all, needs to be fetched separately.
 */
export const getIsLoggedInToLocalRobot = createSelector(
  getLocalRobotAuthState,
  (localRobotAuthState: PerRobotAuthState | null): boolean =>
    localRobotAuthState != null
)

/**
 * On the on-device display, this returns the username of the user currently
 * logged in to the local robot, or null if not logged in. On the desktop app,
 * this is not meaningful.
 */
export const getCurrentUsernameForLocalRobot = createSelector(
  (state: State) => state,
  (state: State) => getLocalRobot(state)?.name ?? null,
  (state: State, localRobotName: string | null): string | null => {
    if (localRobotName == null) return null
    return getAuthStateForRobot(state, localRobotName)?.user.username ?? null
  }
)

interface GetNextExpirationResult {
  robotName: string
  expiresAt: number
}

export const getNextExpiration = createSelector(
  (state: State) => state.robotAuth.perRobotAuthStates,
  (
    perRobotAuthStates: RobotAuthState['perRobotAuthStates']
  ): GetNextExpirationResult | null =>
    Object.entries(perRobotAuthStates).reduce<GetNextExpirationResult | null>(
      (acc, [candidateName, candidateState]) => {
        if (
          candidateState?.expiresAt != null &&
          (acc?.expiresAt == null || candidateState.expiresAt < acc.expiresAt)
        ) {
          return {
            robotName: candidateName,
            expiresAt: candidateState.expiresAt,
          }
        } else {
          return acc
        }
      },
      null
    ),
  {
    memoizeOptions: {
      // Avoid waking up listeners if we return an object that's referentially new
      // but semantically hasn't changed.
      resultEqualityCheck: isEqual,
    },
  }
)
