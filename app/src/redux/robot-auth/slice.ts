/** The Redux slice for authorization and authentication. */

import { createSelector, createSlice } from '@reduxjs/toolkit'
import isEqual from 'lodash/isEqual'

import { type ActionTypesFromSlice } from '../ActionTypesFromSlice'
import { getLocalRobot } from '../discovery'

import type { Draft, PayloadAction } from '@reduxjs/toolkit'
import type { State } from '/app/redux/types'

export interface RobotAuthState {
  perRobotAuthStates: {
    [robotName: string]: PerRobotAuthState | undefined
  }

  /** The robotName of the robot that's most recently been logged into. */
  mostRecentRobotName: string | null
}

interface PerRobotAuthState {
  /** The username that we're currently logged in as. */
  username: string

  /**Whether the server requires this user to set a new password before continuing.*/
  resetPassword: boolean

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
  username: string
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
  resetPassword?: boolean
}

/** Stores the result of logging out of a robot, or of a login naturally timing out. */
interface LogOutOrTimeOutPayload {
  robotName: string
}

interface SetLocalRobotResetPasswordPayload {
  robotName: string
  resetPassword: boolean
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
    /** Updates whether the given robot requires a password reset. */
    setLocalRobotResetPasswordRequired: (
      stateDraft,
      action: PayloadAction<SetLocalRobotResetPasswordPayload>
    ) => {
      const { robotName, resetPassword } = action.payload
      const robotAuthState = stateDraft.perRobotAuthStates[robotName]
      if (robotAuthState != null) {
        robotAuthState.resetPassword = resetPassword
      }
    },
  },
})

function logInOrRefresh(
  stateDraft: Draft<RobotAuthState>,
  payload: LogInOrRefreshPayload
): void {
  const { robotName, ...perRobotAuth } = payload
  stateDraft.perRobotAuthStates[robotName] = {
    resetPassword: false,
    ...perRobotAuth,
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
  setLocalRobotResetPasswordRequired,
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

export interface CurrentUserForLocalRobot {
  username: string | null
  resetPasswordRequired: boolean
}

/**
 * On the on-device display, this returns the username and password-reset flag
 * for the user currently logged in to the local robot. On the desktop app, this
 * is not meaningful.
 */
export const getCurrentUserForLocalRobot = createSelector(
  getLocalRobotAuthState,
  (localRobotAuthState): CurrentUserForLocalRobot => ({
    username: localRobotAuthState?.username ?? null,
    resetPasswordRequired: localRobotAuthState?.resetPassword ?? false,
  })
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
