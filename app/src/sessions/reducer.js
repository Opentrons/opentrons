// @flow
import * as Constants from './constants'

import type { Action } from '../types'

import type { SessionState, PerRobotSessionState } from './types'

const INITIAL_STATE: SessionState = {}

const INITIAL_PER_ROBOT_STATE: PerRobotSessionState = {
  robotSessions: null,
}

export function robotSessionReducer(
  state: SessionState = INITIAL_STATE,
  action: Action
): SessionState {
  switch (action.type) {
    case Constants.CREATE_ROBOT_SESSION_SUCCESS:
    case Constants.FETCH_ROBOT_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionState.sessionId]: sessionState,
          },
        },
      }
    }

    case Constants.UPDATE_ROBOT_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionState.meta.sessionId]: sessionState.meta,
          },
        },
      }
    }

    case Constants.DELETE_ROBOT_SESSION_SUCCESS: {
      const { robotName, sessionId } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionId]: null,
          },
        },
      }
    }
  }

  return state
}
