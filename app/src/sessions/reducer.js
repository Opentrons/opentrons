// @flow
import omit from 'lodash/omit'

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
    case Constants.CREATE_SESSION_SUCCESS:
    case Constants.FETCH_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionState.data.id]: sessionState.data.attributes,
          },
        },
      }
    }

    case Constants.CREATE_SESSION_COMMAND_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE
      const sessionId = sessionState.meta?.sessionId

      if (!sessionId) return state

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...robotState.robotSessions,
            [sessionId]: sessionState.meta,
          },
        },
      }
    }

    case Constants.DELETE_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_PER_ROBOT_STATE

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotSessions: {
            ...omit(robotState.robotSessions, sessionState.data.id),
          },
        },
      }
    }
  }

  return state
}
