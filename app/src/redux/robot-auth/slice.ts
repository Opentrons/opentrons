/** The Redux slice for authorization and authentication. */

import { createSelector, createSlice } from '@reduxjs/toolkit'

import { type ActionTypesFromSlice } from '../ActionTypesFromSlice'
import { getLocalRobot } from '../discovery'

import type { PayloadAction } from '@reduxjs/toolkit'
import type { State } from '/app/redux/types'

export interface RobotAuthState {
  [robotName: string]: PerRobotAuthState | undefined
}

interface PerRobotAuthState {
  /** The username that we're currently logged in as. */
  username: string

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

export const INITIAL_ROBOT_AUTH_STATE: RobotAuthState = {}

/** Stores the result of logging in to a robot, of refreshing an existing login. */
interface LogInOrRefreshPayload {
  robotName: string
  username: string
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
}

/** Stores the result of logging out of a robot, or of a login naturally timing out. */
interface LogOutOrTimeOutPayload {
  robotName: string
}

const robotAuthSlice = createSlice({
  name: 'robotAuth',
  initialState: INITIAL_ROBOT_AUTH_STATE,
  reducers: {
    logInOrRefresh(state, action: PayloadAction<LogInOrRefreshPayload>) {
      const { robotName, ...robotAuthState } = action.payload
      state[robotName] = robotAuthState
    },
    logOutOrTimeOut(state, action: PayloadAction<LogOutOrTimeOutPayload>) {
      // dynamic-delete is normal and fine with Immer and Redux.
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[action.payload.robotName]
    },
  },
})

export const robotAuthReducer = robotAuthSlice.reducer

export const { logInOrRefresh, logOutOrTimeOut } = robotAuthSlice.actions

export type RobotAuthAction = ActionTypesFromSlice<
  typeof robotAuthSlice.actions
>

export function getAuthStateForRobot(
  state: State,
  robotName: string
): PerRobotAuthState | null {
  return state.robotAuth?.[robotName] ?? null
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
